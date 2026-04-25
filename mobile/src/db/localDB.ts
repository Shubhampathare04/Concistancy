import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase;

export async function initDB() {
  db = await SQLite.openDatabaseAsync('consistency.db');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY,
      title TEXT,
      difficulty INTEGER,
      schedule_type TEXT,
      is_active INTEGER DEFAULT 1,
      synced INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS pending_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action_type TEXT,
      payload TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

export async function cacheTasks(tasks: any[]) {
  await db.execAsync('DELETE FROM tasks');
  for (const t of tasks) {
    await db.runAsync(
      'INSERT OR REPLACE INTO tasks (id, title, difficulty, schedule_type, is_active, synced) VALUES (?, ?, ?, ?, ?, 1)',
      [t.id, t.title, t.difficulty, t.schedule_type, t.is_active ? 1 : 0]
    );
  }
}

export async function getLocalTasks() {
  return db.getAllAsync('SELECT * FROM tasks WHERE is_active = 1');
}

export async function queueAction(action_type: string, payload: object) {
  await db.runAsync(
    'INSERT INTO pending_actions (action_type, payload) VALUES (?, ?)',
    [action_type, JSON.stringify(payload)]
  );
}

export async function getPendingActions() {
  return db.getAllAsync('SELECT * FROM pending_actions');
}

export async function clearPendingAction(id: number) {
  await db.runAsync('DELETE FROM pending_actions WHERE id = ?', [id]);
}
