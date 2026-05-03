import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase;

export async function initDB() {
  db = await SQLite.openDatabaseAsync('consistency_v2.db');
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      difficulty INTEGER DEFAULT 1,
      estimated_minutes INTEGER,
      schedule_type TEXT DEFAULT 'daily',
      is_active INTEGER DEFAULT 1,
      created_at TEXT,
      updated_at TEXT,
      synced INTEGER DEFAULT 1,
      deleted_at TEXT,
      target INTEGER,
      sensor_type TEXT
    );

    CREATE TABLE IF NOT EXISTS pending_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idempotency_key TEXT UNIQUE NOT NULL,
      action_type TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      priority INTEGER DEFAULT 5,
      retry_count INTEGER DEFAULT 0,
      max_retries INTEGER DEFAULT 5,
      next_retry_at TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now')),
      last_attempted_at TEXT,
      error TEXT
    );

    CREATE TABLE IF NOT EXISTS completions_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      completed_at TEXT NOT NULL,
      idempotency_key TEXT UNIQUE NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_pending_status_priority
      ON pending_actions(status, priority, next_retry_at);
    CREATE INDEX IF NOT EXISTS idx_tasks_active ON tasks(is_active);
  `);

  // Migrate existing DB: add new columns if they don't exist (safe on re-init)
  await _runSafe(`ALTER TABLE pending_actions ADD COLUMN priority INTEGER DEFAULT 5`);
  await _runSafe(`ALTER TABLE pending_actions ADD COLUMN next_retry_at TEXT DEFAULT (datetime('now'))`);
  await _runSafe(`ALTER TABLE pending_actions ADD COLUMN max_retries INTEGER DEFAULT 5`);
  await _runSafe(`ALTER TABLE tasks ADD COLUMN target INTEGER`);
  await _runSafe(`ALTER TABLE tasks ADD COLUMN sensor_type TEXT`);
}

async function _runSafe(sql: string) {
  try { await db.execAsync(sql); } catch { /* column already exists */ }
}

// ─── Priority constants ───────────────────────────────────────────────────────
// Lower number = higher priority (processed first)
export const PRIORITY = {
  CRITICAL: 1,  // complete_task — affects streak, must not be lost
  HIGH:     3,  // create_task
  NORMAL:   5,  // update_task
  LOW:      8,  // delete_task
} as const;

const ACTION_PRIORITY: Record<string, number> = {
  complete_task: PRIORITY.CRITICAL,
  create_task:   PRIORITY.HIGH,
  update_task:   PRIORITY.NORMAL,
  delete_task:   PRIORITY.LOW,
};

// ─── Tasks Cache ──────────────────────────────────────────────────────────────

export async function cacheTasks(tasks: any[]) {
  await db.execAsync('DELETE FROM tasks');
  for (const t of tasks) {
    await db.runAsync(
      `INSERT OR REPLACE INTO tasks
       (id, title, description, difficulty, estimated_minutes, schedule_type, is_active, created_at, synced, target, sensor_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [t.id, t.title, t.description ?? null, t.difficulty, t.estimated_minutes ?? null,
       t.schedule_type, t.is_active ? 1 : 0, t.created_at, t.target ?? null, t.sensor_type ?? null]
    );
  }
}

export async function getLocalTasks(): Promise<any[]> {
  return db.getAllAsync('SELECT * FROM tasks WHERE is_active = 1 AND deleted_at IS NULL');
}

export async function markTaskDeletedLocally(taskId: number) {
  await db.runAsync(
    'UPDATE tasks SET deleted_at = datetime("now"), is_active = 0 WHERE id = ?',
    [taskId]
  );
}

// ─── Pending Actions Queue ────────────────────────────────────────────────────

export function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function queueAction(action_type: string, payload: object): Promise<string> {
  const key = generateIdempotencyKey();
  const priority = ACTION_PRIORITY[action_type] ?? PRIORITY.NORMAL;
  await db.runAsync(
    `INSERT OR IGNORE INTO pending_actions
       (idempotency_key, action_type, payload, priority, next_retry_at)
     VALUES (?, ?, ?, ?, datetime('now'))`,
    [key, action_type, JSON.stringify(payload), priority]
  );
  return key;
}

export async function getPendingActions(): Promise<any[]> {
  // Only return actions whose next_retry_at has passed — enforces exponential backoff
  // Ordered by priority ASC (critical first), then created_at ASC (FIFO within priority)
  return db.getAllAsync(
    `SELECT * FROM pending_actions
     WHERE status = 'pending'
       AND retry_count < max_retries
       AND next_retry_at <= datetime('now')
     ORDER BY priority ASC, created_at ASC
     LIMIT 20`
  );
}

export async function markActionProcessed(id: number) {
  await db.runAsync(
    `UPDATE pending_actions SET status = 'processed' WHERE id = ?`,
    [id]
  );
}

export async function markActionFailed(id: number, error: string) {
  // Exponential backoff: 2^retry_count * 30 seconds, capped at 1 hour
  // retry 0 → 30s, retry 1 → 60s, retry 2 → 120s, retry 3 → 240s, retry 4 → 480s
  await db.runAsync(
    `UPDATE pending_actions
     SET retry_count        = retry_count + 1,
         last_attempted_at  = datetime('now'),
         error              = ?,
         next_retry_at      = datetime('now', '+' || MIN(CAST(POWER(2, retry_count) * 30 AS INTEGER), 3600) || ' seconds'),
         status             = CASE
                                WHEN retry_count + 1 >= max_retries THEN 'failed'
                                ELSE 'pending'
                              END
     WHERE id = ?`,
    [error, id]
  );
}

export async function getFailedActions(): Promise<any[]> {
  return db.getAllAsync(
    `SELECT * FROM pending_actions WHERE status = 'failed' ORDER BY created_at DESC`
  );
}

export async function getPendingCount(): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM pending_actions WHERE status = 'pending'`
  );
  return row?.count ?? 0;
}

export async function clearProcessedActions() {
  await db.runAsync(`DELETE FROM pending_actions WHERE status = 'processed'`);
}

export async function resetFailedActions() {
  // Allows manual retry of permanently failed actions (e.g. user taps "Retry All")
  await db.runAsync(
    `UPDATE pending_actions
     SET status = 'pending', retry_count = 0, next_retry_at = datetime('now')
     WHERE status = 'failed'`
  );
}

// ─── Completions Cache ────────────────────────────────────────────────────────

export async function cacheCompletion(taskId: number, idempotencyKey: string) {
  await db.runAsync(
    `INSERT OR IGNORE INTO completions_cache (task_id, completed_at, idempotency_key)
     VALUES (?, datetime('now'), ?)`,
    [taskId, idempotencyKey]
  );
}

export async function isAlreadyCompleted(idempotencyKey: string): Promise<boolean> {
  const row = await db.getFirstAsync(
    'SELECT id FROM completions_cache WHERE idempotency_key = ?',
    [idempotencyKey]
  );
  return !!row;
}
