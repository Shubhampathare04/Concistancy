"""add domain tables: fcm_tokens habits events social professionals subscriptions

Revision ID: f1a2b3c4d5e6
Revises: e8ccbc70b686
Create Date: 2026-05-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'f1a2b3c4d5e6'
down_revision = 'e8ccbc70b686'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('fcm_tokens',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.BigInteger(), nullable=False),
        sa.Column('token', sa.String(512), nullable=False),
        sa.Column('platform', sa.String(20), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token'),
    )
    op.create_index('ix_fcm_tokens_user_id', 'fcm_tokens', ['user_id'])

    op.create_table('habits',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.BigInteger(), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('category', sa.Enum('health','fitness','mental','diet','other'), nullable=True),
        sa.Column('frequency', sa.Enum('daily','weekly'), nullable=True),
        sa.Column('reminder_time', sa.Time(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_habits_user_id', 'habits', ['user_id'])

    op.create_table('habit_logs',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('habit_id', sa.BigInteger(), nullable=True),
        sa.Column('user_id', sa.BigInteger(), nullable=True),
        sa.Column('logged_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('note', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['habit_id'], ['habits.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_habit_logs_habit_id', 'habit_logs', ['habit_id'])

    op.create_table('events',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('type', sa.Enum('challenge','event'), nullable=True),
        sa.Column('start_date', sa.DateTime(), nullable=False),
        sa.Column('end_date', sa.DateTime(), nullable=False),
        sa.Column('reward_coins', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table('event_participants',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('event_id', sa.BigInteger(), nullable=True),
        sa.Column('user_id', sa.BigInteger(), nullable=True),
        sa.Column('joined_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('rank', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['event_id'], ['events.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_event_participant', 'event_participants', ['event_id', 'user_id'])

    op.create_table('follows',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('follower_id', sa.BigInteger(), nullable=True),
        sa.Column('following_id', sa.BigInteger(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['follower_id'], ['users.id']),
        sa.ForeignKeyConstraint(['following_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_follow_pair', 'follows', ['follower_id', 'following_id'])

    op.create_table('messages',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('room_id', sa.String(100), nullable=False),
        sa.Column('sender_id', sa.BigInteger(), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('read_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['sender_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_messages_room_id', 'messages', ['room_id'])

    op.create_table('professionals',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.BigInteger(), nullable=False),
        sa.Column('specialty', sa.String(100), nullable=False),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('hourly_rate', sa.Float(), nullable=True),
        sa.Column('is_verified', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
    )

    op.create_table('consultations',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('professional_id', sa.BigInteger(), nullable=True),
        sa.Column('client_id', sa.BigInteger(), nullable=True),
        sa.Column('scheduled_at', sa.DateTime(), nullable=False),
        sa.Column('status', sa.Enum('pending','confirmed','completed','cancelled'), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['client_id'], ['users.id']),
        sa.ForeignKeyConstraint(['professional_id'], ['professionals.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_consultations_client_id', 'consultations', ['client_id'])
    op.create_index('ix_consultations_professional_id', 'consultations', ['professional_id'])

    op.create_table('subscriptions',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.BigInteger(), nullable=False),
        sa.Column('plan', sa.Enum('free','pro','elite'), nullable=True),
        sa.Column('status', sa.Enum('active','expired','cancelled'), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('streak_freeze_count', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
    )


def downgrade():
    op.drop_table('subscriptions')
    op.drop_table('consultations')
    op.drop_table('professionals')
    op.drop_table('messages')
    op.drop_table('follows')
    op.drop_table('event_participants')
    op.drop_table('events')
    op.drop_table('habit_logs')
    op.drop_table('habits')
    op.drop_table('fcm_tokens')
