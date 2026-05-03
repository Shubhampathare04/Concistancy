"""add community tables: groups group_members challenges progress messages reactions

Revision ID: b2c3d4e5f6a7
Revises: a9b8c7d6e5f4
Create Date: 2026-05-03 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'b2c3d4e5f6a7'
down_revision = 'a9b8c7d6e5f4'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('groups',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('avatar_emoji', sa.String(10), nullable=True),
        sa.Column('created_by', sa.BigInteger(), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=True),
        sa.Column('max_members', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_groups_created_by', 'groups', ['created_by'])

    op.create_table('group_members',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('group_id', sa.BigInteger(), nullable=True),
        sa.Column('user_id', sa.BigInteger(), nullable=True),
        sa.Column('role', sa.Enum('admin', 'member'), nullable=True),
        sa.Column('joined_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='1'),
        sa.ForeignKeyConstraint(['group_id'], ['groups.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_group_member', 'group_members', ['group_id', 'user_id'])

    op.create_table('group_challenges',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('group_id', sa.BigInteger(), nullable=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('target_value', sa.Integer(), nullable=False),
        sa.Column('target_unit', sa.String(50), nullable=True),
        sa.Column('start_date', sa.DateTime(), nullable=False),
        sa.Column('end_date', sa.DateTime(), nullable=False),
        sa.Column('reward_coins', sa.Integer(), nullable=True),
        sa.Column('created_by', sa.BigInteger(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.ForeignKeyConstraint(['group_id'], ['groups.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_group_challenges_group_id', 'group_challenges', ['group_id'])

    op.create_table('group_challenge_progress',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('challenge_id', sa.BigInteger(), nullable=True),
        sa.Column('user_id', sa.BigInteger(), nullable=True),
        sa.Column('current_value', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('last_updated', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['challenge_id'], ['group_challenges.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_challenge_progress', 'group_challenge_progress', ['challenge_id', 'user_id'])

    op.create_table('group_messages',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('group_id', sa.BigInteger(), nullable=True),
        sa.Column('sender_id', sa.BigInteger(), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('message_type', sa.Enum('text', 'system', 'achievement'), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('edited_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['group_id'], ['groups.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_group_msg', 'group_messages', ['group_id', 'created_at'])

    op.create_table('message_reactions',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('message_id', sa.BigInteger(), nullable=True),
        sa.Column('user_id', sa.BigInteger(), nullable=True),
        sa.Column('emoji', sa.String(10), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['message_id'], ['group_messages.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_reaction_msg_user', 'message_reactions', ['message_id', 'user_id'])


def downgrade():
    op.drop_table('message_reactions')
    op.drop_table('group_messages')
    op.drop_table('group_challenge_progress')
    op.drop_table('group_challenges')
    op.drop_table('group_members')
    op.drop_table('groups')
