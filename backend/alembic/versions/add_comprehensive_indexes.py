"""Add comprehensive database indexes

Revision ID: add_comprehensive_indexes
Revises: security_enhancements_001
Create Date: 2025-01-XX

Adds indexes on all foreign keys and frequently queried columns
for optimal query performance.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_comprehensive_indexes'
down_revision = 'security_enhancements_001'
branch_labels = None
depends_on = None


def upgrade():
    # Tasks table indexes
    op.create_index('idx_tasks_user_created', 'tasks', ['user_id', 'created_at'])
    op.create_index('idx_tasks_user_active_deleted', 'tasks', ['user_id', 'is_active', 'deleted_at'])
    op.create_index('idx_tasks_schedule_type', 'tasks', ['schedule_type'])
    
    # Task completions indexes
    op.create_index('idx_completions_task', 'task_completions', ['task_id'])
    op.create_index('idx_completions_user_completed', 'task_completions', ['user_id', 'completed_at'])
    op.create_index('idx_completions_idempotency', 'task_completions', ['idempotency_key'])
    
    # Task schedules indexes
    op.create_index('idx_schedules_task', 'task_schedules', ['task_id'])
    op.create_index('idx_schedules_day', 'task_schedules', ['day_of_week'])
    
    # Streaks indexes (already has PK on user_id)
    op.create_index('idx_streaks_last_completed', 'streaks', ['last_completed_date'])
    
    # User stats indexes (already has PK on user_id)
    op.create_index('idx_user_stats_level', 'user_stats', ['level'])
    op.create_index('idx_user_stats_xp', 'user_stats', ['xp'])
    op.create_index('idx_user_stats_consistency', 'user_stats', ['consistency_index'])
    
    # Activity logs indexes
    op.create_index('idx_activity_user_action', 'activity_logs', ['user_id', 'action_type'])
    op.create_index('idx_activity_created', 'activity_logs', ['created_at'])
    
    # Behavior scores indexes
    op.create_index('idx_behavior_user', 'behavior_scores', ['user_id'])
    op.create_index('idx_behavior_task', 'behavior_scores', ['task_id'])
    op.create_index('idx_behavior_computed', 'behavior_scores', ['computed_at'])
    
    # Refresh tokens indexes
    op.create_index('idx_refresh_tokens_user', 'refresh_tokens', ['user_id'])
    op.create_index('idx_refresh_tokens_expires', 'refresh_tokens', ['expires_at'])
    op.create_index('idx_refresh_tokens_revoked', 'refresh_tokens', ['revoked'])
    
    # FCM tokens indexes
    op.create_index('idx_fcm_tokens_user', 'fcm_tokens', ['user_id'])
    op.create_index('idx_fcm_tokens_active', 'fcm_tokens', ['is_active'])
    
    # Habits indexes
    op.create_index('idx_habits_user', 'habits', ['user_id'])
    op.create_index('idx_habits_active', 'habits', ['is_active'])
    op.create_index('idx_habits_category', 'habits', ['category'])
    
    # Habit logs indexes
    op.create_index('idx_habit_logs_habit', 'habit_logs', ['habit_id'])
    op.create_index('idx_habit_logs_user', 'habit_logs', ['user_id'])
    op.create_index('idx_habit_logs_logged', 'habit_logs', ['logged_at'])
    
    # Habit streaks indexes (already has PK on habit_id)
    op.create_index('idx_habit_streaks_user', 'habit_streaks', ['user_id'])
    
    # Events indexes
    op.create_index('idx_events_active', 'events', ['is_active'])
    op.create_index('idx_events_dates', 'events', ['start_date', 'end_date'])
    op.create_index('idx_events_type', 'events', ['type'])
    
    # Event participants indexes
    op.create_index('idx_event_participants_event', 'event_participants', ['event_id'])
    op.create_index('idx_event_participants_user', 'event_participants', ['user_id'])
    op.create_index('idx_event_participants_completed', 'event_participants', ['completed_at'])
    
    # Follows indexes
    op.create_index('idx_follows_follower', 'follows', ['follower_id'])
    op.create_index('idx_follows_following', 'follows', ['following_id'])
    
    # Messages indexes
    op.create_index('idx_messages_room', 'messages', ['room_id'])
    op.create_index('idx_messages_sender', 'messages', ['sender_id'])
    op.create_index('idx_messages_created', 'messages', ['created_at'])
    
    # Professionals indexes
    op.create_index('idx_professionals_user', 'professionals', ['user_id'])
    op.create_index('idx_professionals_verified', 'professionals', ['is_verified'])
    op.create_index('idx_professionals_specialty', 'professionals', ['specialty'])
    
    # Consultations indexes
    op.create_index('idx_consultations_professional', 'consultations', ['professional_id'])
    op.create_index('idx_consultations_client', 'consultations', ['client_id'])
    op.create_index('idx_consultations_scheduled', 'consultations', ['scheduled_at'])
    op.create_index('idx_consultations_status', 'consultations', ['status'])
    
    # Subscriptions indexes (already has unique on user_id)
    op.create_index('idx_subscriptions_plan', 'subscriptions', ['plan'])
    op.create_index('idx_subscriptions_status', 'subscriptions', ['status'])
    op.create_index('idx_subscriptions_expires', 'subscriptions', ['expires_at'])
    
    # Sync queue indexes
    op.create_index('idx_sync_queue_user', 'sync_queue', ['user_id'])
    op.create_index('idx_sync_queue_status', 'sync_queue', ['status'])
    op.create_index('idx_sync_queue_created', 'sync_queue', ['created_at'])
    
    # Task skips indexes
    op.create_index('idx_task_skips_task', 'task_skips', ['task_id'])
    op.create_index('idx_task_skips_user', 'task_skips', ['user_id'])
    op.create_index('idx_task_skips_date', 'task_skips', ['skipped_date'])
    
    # Mood logs indexes
    op.create_index('idx_mood_logs_user', 'mood_logs', ['user_id'])
    op.create_index('idx_mood_logs_task', 'mood_logs', ['task_id'])
    op.create_index('idx_mood_logs_created', 'mood_logs', ['created_at'])
    
    # Personal records indexes
    op.create_index('idx_personal_records_user', 'personal_records', ['user_id'])
    op.create_index('idx_personal_records_task', 'personal_records', ['task_id'])
    op.create_index('idx_personal_records_type', 'personal_records', ['record_type'])
    
    # Consistency snapshots indexes
    op.create_index('idx_consistency_snapshots_user', 'consistency_snapshots', ['user_id'])
    op.create_index('idx_consistency_snapshots_date', 'consistency_snapshots', ['snapped_at'])
    
    # Rivals indexes
    op.create_index('idx_rivals_challenger', 'rivals', ['challenger_id'])
    op.create_index('idx_rivals_rival', 'rivals', ['rival_id'])
    
    # XP multiplier windows indexes
    op.create_index('idx_xp_multiplier_user', 'xp_multiplier_windows', ['user_id'])
    op.create_index('idx_xp_multiplier_dates', 'xp_multiplier_windows', ['starts_at', 'ends_at'])
    
    # Task reminders indexes
    op.create_index('idx_task_reminders_task', 'task_reminders', ['task_id'])
    op.create_index('idx_task_reminders_user', 'task_reminders', ['user_id'])
    op.create_index('idx_task_reminders_active', 'task_reminders', ['is_active'])
    
    # Groups indexes
    op.create_index('idx_groups_created_by', 'groups', ['created_by'])
    op.create_index('idx_groups_public', 'groups', ['is_public'])
    op.create_index('idx_groups_created', 'groups', ['created_at'])
    
    # Group members indexes
    op.create_index('idx_group_members_group', 'group_members', ['group_id'])
    op.create_index('idx_group_members_user', 'group_members', ['user_id'])
    op.create_index('idx_group_members_active', 'group_members', ['is_active'])
    op.create_index('idx_group_members_role', 'group_members', ['role'])
    
    # Group challenges indexes
    op.create_index('idx_group_challenges_group', 'group_challenges', ['group_id'])
    op.create_index('idx_group_challenges_created_by', 'group_challenges', ['created_by'])
    op.create_index('idx_group_challenges_dates', 'group_challenges', ['start_date', 'end_date'])
    op.create_index('idx_group_challenges_active', 'group_challenges', ['is_active'])
    
    # Group challenge progress indexes
    op.create_index('idx_group_challenge_progress_challenge', 'group_challenge_progress', ['challenge_id'])
    op.create_index('idx_group_challenge_progress_user', 'group_challenge_progress', ['user_id'])
    op.create_index('idx_group_challenge_progress_completed', 'group_challenge_progress', ['completed_at'])
    
    # Group messages indexes
    op.create_index('idx_group_messages_group', 'group_messages', ['group_id'])
    op.create_index('idx_group_messages_sender', 'group_messages', ['sender_id'])
    op.create_index('idx_group_messages_created', 'group_messages', ['created_at'])
    op.create_index('idx_group_messages_type', 'group_messages', ['message_type'])
    
    # Message reactions indexes
    op.create_index('idx_message_reactions_message', 'message_reactions', ['message_id'])
    op.create_index('idx_message_reactions_user', 'message_reactions', ['user_id'])
    
    # Weekly analytics indexes
    op.create_index('idx_weekly_analytics_user', 'weekly_analytics', ['user_id'])
    op.create_index('idx_weekly_analytics_week', 'weekly_analytics', ['week_start'])


def downgrade():
    # Drop all indexes in reverse order
    op.drop_index('idx_weekly_analytics_week', table_name='weekly_analytics')
    op.drop_index('idx_weekly_analytics_user', table_name='weekly_analytics')
    op.drop_index('idx_message_reactions_user', table_name='message_reactions')
    op.drop_index('idx_message_reactions_message', table_name='message_reactions')
    op.drop_index('idx_group_messages_type', table_name='group_messages')
    op.drop_index('idx_group_messages_created', table_name='group_messages')
    op.drop_index('idx_group_messages_sender', table_name='group_messages')
    op.drop_index('idx_group_messages_group', table_name='group_messages')
    op.drop_index('idx_group_challenge_progress_completed', table_name='group_challenge_progress')
    op.drop_index('idx_group_challenge_progress_user', table_name='group_challenge_progress')
    op.drop_index('idx_group_challenge_progress_challenge', table_name='group_challenge_progress')
    op.drop_index('idx_group_challenges_active', table_name='group_challenges')
    op.drop_index('idx_group_challenges_dates', table_name='group_challenges')
    op.drop_index('idx_group_challenges_created_by', table_name='group_challenges')
    op.drop_index('idx_group_challenges_group', table_name='group_challenges')
    op.drop_index('idx_group_members_role', table_name='group_members')
    op.drop_index('idx_group_members_active', table_name='group_members')
    op.drop_index('idx_group_members_user', table_name='group_members')
    op.drop_index('idx_group_members_group', table_name='group_members')
    op.drop_index('idx_groups_created', table_name='groups')
    op.drop_index('idx_groups_public', table_name='groups')
    op.drop_index('idx_groups_created_by', table_name='groups')
    op.drop_index('idx_task_reminders_active', table_name='task_reminders')
    op.drop_index('idx_task_reminders_user', table_name='task_reminders')
    op.drop_index('idx_task_reminders_task', table_name='task_reminders')
    op.drop_index('idx_xp_multiplier_dates', table_name='xp_multiplier_windows')
    op.drop_index('idx_xp_multiplier_user', table_name='xp_multiplier_windows')
    op.drop_index('idx_rivals_rival', table_name='rivals')
    op.drop_index('idx_rivals_challenger', table_name='rivals')
    op.drop_index('idx_consistency_snapshots_date', table_name='consistency_snapshots')
    op.drop_index('idx_consistency_snapshots_user', table_name='consistency_snapshots')
    op.drop_index('idx_personal_records_type', table_name='personal_records')
    op.drop_index('idx_personal_records_task', table_name='personal_records')
    op.drop_index('idx_personal_records_user', table_name='personal_records')
    op.drop_index('idx_mood_logs_created', table_name='mood_logs')
    op.drop_index('idx_mood_logs_task', table_name='mood_logs')
    op.drop_index('idx_mood_logs_user', table_name='mood_logs')
    op.drop_index('idx_task_skips_date', table_name='task_skips')
    op.drop_index('idx_task_skips_user', table_name='task_skips')
    op.drop_index('idx_task_skips_task', table_name='task_skips')
    op.drop_index('idx_sync_queue_created', table_name='sync_queue')
    op.drop_index('idx_sync_queue_status', table_name='sync_queue')
    op.drop_index('idx_sync_queue_user', table_name='sync_queue')
    op.drop_index('idx_subscriptions_expires', table_name='subscriptions')
    op.drop_index('idx_subscriptions_status', table_name='subscriptions')
    op.drop_index('idx_subscriptions_plan', table_name='subscriptions')
    op.drop_index('idx_consultations_status', table_name='consultations')
    op.drop_index('idx_consultations_scheduled', table_name='consultations')
    op.drop_index('idx_consultations_client', table_name='consultations')
    op.drop_index('idx_consultations_professional', table_name='consultations')
    op.drop_index('idx_professionals_specialty', table_name='professionals')
    op.drop_index('idx_professionals_verified', table_name='professionals')
    op.drop_index('idx_professionals_user', table_name='professionals')
    op.drop_index('idx_messages_created', table_name='messages')
    op.drop_index('idx_messages_sender', table_name='messages')
    op.drop_index('idx_messages_room', table_name='messages')
    op.drop_index('idx_follows_following', table_name='follows')
    op.drop_index('idx_follows_follower', table_name='follows')
    op.drop_index('idx_event_participants_completed', table_name='event_participants')
    op.drop_index('idx_event_participants_user', table_name='event_participants')
    op.drop_index('idx_event_participants_event', table_name='event_participants')
    op.drop_index('idx_events_type', table_name='events')
    op.drop_index('idx_events_dates', table_name='events')
    op.drop_index('idx_events_active', table_name='events')
    op.drop_index('idx_habit_streaks_user', table_name='habit_streaks')
    op.drop_index('idx_habit_logs_logged', table_name='habit_logs')
    op.drop_index('idx_habit_logs_user', table_name='habit_logs')
    op.drop_index('idx_habit_logs_habit', table_name='habit_logs')
    op.drop_index('idx_habits_category', table_name='habits')
    op.drop_index('idx_habits_active', table_name='habits')
    op.drop_index('idx_habits_user', table_name='habits')
    op.drop_index('idx_fcm_tokens_active', table_name='fcm_tokens')
    op.drop_index('idx_fcm_tokens_user', table_name='fcm_tokens')
    op.drop_index('idx_refresh_tokens_revoked', table_name='refresh_tokens')
    op.drop_index('idx_refresh_tokens_expires', table_name='refresh_tokens')
    op.drop_index('idx_refresh_tokens_user', table_name='refresh_tokens')
    op.drop_index('idx_behavior_computed', table_name='behavior_scores')
    op.drop_index('idx_behavior_task', table_name='behavior_scores')
    op.drop_index('idx_behavior_user', table_name='behavior_scores')
    op.drop_index('idx_activity_created', table_name='activity_logs')
    op.drop_index('idx_activity_user_action', table_name='activity_logs')
    op.drop_index('idx_user_stats_consistency', table_name='user_stats')
    op.drop_index('idx_user_stats_xp', table_name='user_stats')
    op.drop_index('idx_user_stats_level', table_name='user_stats')
    op.drop_index('idx_streaks_last_completed', table_name='streaks')
    op.drop_index('idx_schedules_day', table_name='task_schedules')
    op.drop_index('idx_schedules_task', table_name='task_schedules')
    op.drop_index('idx_completions_idempotency', table_name='task_completions')
    op.drop_index('idx_completions_user_completed', table_name='task_completions')
    op.drop_index('idx_completions_task', table_name='task_completions')
    op.drop_index('idx_tasks_schedule_type', table_name='tasks')
    op.drop_index('idx_tasks_user_active_deleted', table_name='tasks')
    op.drop_index('idx_tasks_user_created', table_name='tasks')
