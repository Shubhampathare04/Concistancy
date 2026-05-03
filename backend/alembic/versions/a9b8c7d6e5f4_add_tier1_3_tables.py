"""add tier1-3 tables: onboarding mood records snapshots rivals multipliers reminders

Revision ID: a9b8c7d6e5f4
Revises: f1a2b3c4d5e6
Create Date: 2026-05-02 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'a9b8c7d6e5f4'
down_revision = 'f1a2b3c4d5e6'
branch_labels = None
depends_on = None


def upgrade():
    # Users: is_onboarded
    op.add_column('users', sa.Column('is_onboarded', sa.Boolean(), nullable=True, server_default='0'))

    # Streaks: shields + recovery
    op.add_column('streaks', sa.Column('streak_shields', sa.Integer(), nullable=True, server_default='0'))
    op.add_column('streaks', sa.Column('recovery_expires_at', sa.DateTime(), nullable=True))

    op.create_table('mood_logs',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.BigInteger(), nullable=True),
        sa.Column('task_id', sa.BigInteger(), nullable=True),
        sa.Column('mood', sa.Integer(), nullable=False),
        sa.Column('energy', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_mood_user_time', 'mood_logs', ['user_id', 'created_at'])

    op.create_table('personal_records',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.BigInteger(), nullable=True),
        sa.Column('task_id', sa.BigInteger(), nullable=True),
        sa.Column('record_type', sa.String(50), nullable=False),
        sa.Column('value', sa.Float(), nullable=False),
        sa.Column('achieved_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_pr_user_task_type', 'personal_records', ['user_id', 'task_id', 'record_type'])

    op.create_table('consistency_snapshots',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.BigInteger(), nullable=True),
        sa.Column('score', sa.Float(), nullable=False),
        sa.Column('snapped_at', sa.Date(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_snapshot_user_date', 'consistency_snapshots', ['user_id', 'snapped_at'])

    op.create_table('habit_streaks',
        sa.Column('habit_id', sa.BigInteger(), nullable=False),
        sa.Column('user_id', sa.BigInteger(), nullable=True),
        sa.Column('current_streak', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('longest_streak', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('last_logged_date', sa.Date(), nullable=True),
        sa.ForeignKeyConstraint(['habit_id'], ['habits.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('habit_id'),
    )

    op.create_table('rivals',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('challenger_id', sa.BigInteger(), nullable=True),
        sa.Column('rival_id', sa.BigInteger(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['challenger_id'], ['users.id']),
        sa.ForeignKeyConstraint(['rival_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_rival_pair', 'rivals', ['challenger_id', 'rival_id'])

    op.create_table('xp_multiplier_windows',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.BigInteger(), nullable=True),
        sa.Column('multiplier', sa.Float(), nullable=True, server_default='2.0'),
        sa.Column('starts_at', sa.DateTime(), nullable=False),
        sa.Column('ends_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table('task_reminders',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('task_id', sa.BigInteger(), nullable=True),
        sa.Column('user_id', sa.BigInteger(), nullable=True),
        sa.Column('remind_at', sa.Time(), nullable=False),
        sa.Column('days_of_week', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='1'),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade():
    op.drop_table('task_reminders')
    op.drop_table('xp_multiplier_windows')
    op.drop_table('rivals')
    op.drop_table('habit_streaks')
    op.drop_table('consistency_snapshots')
    op.drop_table('personal_records')
    op.drop_table('mood_logs')
    op.drop_column('streaks', 'recovery_expires_at')
    op.drop_column('streaks', 'streak_shields')
    op.drop_column('users', 'is_onboarded')
