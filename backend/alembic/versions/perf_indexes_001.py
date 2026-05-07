"""add_performance_indexes

Revision ID: perf_indexes_001
Revises: add_comprehensive_indexes
Create Date: 2025-01-XX

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'perf_indexes_001'
down_revision = 'add_comprehensive_indexes'
branch_labels = None
depends_on = None


def upgrade():
    # Tasks table indexes
    op.create_index('idx_tasks_user_status', 'tasks', ['user_id', 'status'])
    op.create_index('idx_tasks_user_created', 'tasks', ['user_id', 'created_at'])
    op.create_index('idx_tasks_due_date', 'tasks', ['due_date'])
    op.create_index('idx_tasks_category', 'tasks', ['category'])
    
    # Completions table indexes
    op.create_index('idx_completions_user_date', 'completions', ['user_id', 'completed_at'])
    op.create_index('idx_completions_task_date', 'completions', ['task_id', 'completed_at'])
    
    # Streaks table indexes
    op.create_index('idx_streaks_user_active', 'streaks', ['user_id', 'is_active'])
    op.create_index('idx_streaks_current_length', 'streaks', ['current_length'])
    
    # User stats indexes
    op.create_index('idx_user_stats_level', 'user_stats', ['level'])
    op.create_index('idx_user_stats_xp', 'user_stats', ['total_xp'])
    
    # Social features indexes
    op.create_index('idx_connections_user1', 'connections', ['user_id_1'])
    op.create_index('idx_connections_user2', 'connections', ['user_id_2'])
    op.create_index('idx_connections_status', 'connections', ['status'])
    
    op.create_index('idx_group_members_group', 'group_members', ['group_id'])
    op.create_index('idx_group_members_user', 'group_members', ['user_id'])
    op.create_index('idx_group_members_role', 'group_members', ['role'])
    
    op.create_index('idx_group_messages_group_created', 'group_messages', ['group_id', 'created_at'])
    op.create_index('idx_group_messages_sender', 'group_messages', ['sender_id'])
    
    op.create_index('idx_group_challenges_group_status', 'group_challenges', ['group_id', 'status'])
    op.create_index('idx_group_challenges_end_date', 'group_challenges', ['end_date'])
    
    # Notifications indexes
    op.create_index('idx_notifications_user_read', 'notifications', ['user_id', 'is_read'])
    op.create_index('idx_notifications_created', 'notifications', ['created_at'])
    
    # Behavior scores indexes
    op.create_index('idx_behavior_scores_user_date', 'behavior_scores', ['user_id', 'date'])
    op.create_index('idx_behavior_scores_consistency', 'behavior_scores', ['consistency_index'])


def downgrade():
    # Drop all indexes
    op.drop_index('idx_tasks_user_status', 'tasks')
    op.drop_index('idx_tasks_user_created', 'tasks')
    op.drop_index('idx_tasks_due_date', 'tasks')
    op.drop_index('idx_tasks_category', 'tasks')
    
    op.drop_index('idx_completions_user_date', 'completions')
    op.drop_index('idx_completions_task_date', 'completions')
    
    op.drop_index('idx_streaks_user_active', 'streaks')
    op.drop_index('idx_streaks_current_length', 'streaks')
    
    op.drop_index('idx_user_stats_level', 'user_stats')
    op.drop_index('idx_user_stats_xp', 'user_stats')
    
    op.drop_index('idx_connections_user1', 'connections')
    op.drop_index('idx_connections_user2', 'connections')
    op.drop_index('idx_connections_status', 'connections')
    
    op.drop_index('idx_group_members_group', 'group_members')
    op.drop_index('idx_group_members_user', 'group_members')
    op.drop_index('idx_group_members_role', 'group_members')
    
    op.drop_index('idx_group_messages_group_created', 'group_messages')
    op.drop_index('idx_group_messages_sender', 'group_messages')
    
    op.drop_index('idx_group_challenges_group_status', 'group_challenges')
    op.drop_index('idx_group_challenges_end_date', 'group_challenges')
    
    op.drop_index('idx_notifications_user_read', 'notifications')
    op.drop_index('idx_notifications_created', 'notifications')
    
    op.drop_index('idx_behavior_scores_user_date', 'behavior_scores')
    op.drop_index('idx_behavior_scores_consistency', 'behavior_scores')
