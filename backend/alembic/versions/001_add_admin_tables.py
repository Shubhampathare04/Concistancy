"""add admin tables

Revision ID: 001_add_admin_tables
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

revision = '001_add_admin_tables'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Admin users table
    op.create_table(
        'admin_users',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('name', sa.String(100), nullable=True),
        sa.Column('role', sa.Enum('super_admin', 'admin', 'analyst'), nullable=False, server_default='analyst'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('last_login_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    op.create_index('idx_admin_email', 'admin_users', ['email'])
    op.create_index('idx_admin_role', 'admin_users', ['role'])

    # Audit logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('admin_id', sa.BigInteger(), nullable=False),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('entity_type', sa.String(50), nullable=False),
        sa.Column('entity_id', sa.BigInteger(), nullable=True),
        sa.Column('meta_data', sa.JSON(), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['admin_id'], ['admin_users.id'], ondelete='CASCADE')
    )
    op.create_index('idx_audit_admin', 'audit_logs', ['admin_id'])
    op.create_index('idx_audit_entity', 'audit_logs', ['entity_type', 'entity_id'])
    op.create_index('idx_audit_created', 'audit_logs', ['created_at'])

    # Payments table
    op.create_table(
        'payments',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.BigInteger(), nullable=False),
        sa.Column('subscription_id', sa.BigInteger(), nullable=True),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('currency', sa.String(3), nullable=False, server_default='USD'),
        sa.Column('status', sa.Enum('pending', 'completed', 'failed', 'refunded'), nullable=False, server_default='pending'),
        sa.Column('provider', sa.String(50), nullable=False),
        sa.Column('provider_transaction_id', sa.String(255), nullable=True),
        sa.Column('meta_data', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subscription_id'], ['subscriptions.id'], ondelete='SET NULL')
    )
    op.create_index('idx_payment_user', 'payments', ['user_id'])
    op.create_index('idx_payment_status', 'payments', ['status'])
    op.create_index('idx_payment_created', 'payments', ['created_at'])

    # Add banned_at and ban_reason to users table
    op.add_column('users', sa.Column('banned_at', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('ban_reason', sa.Text(), nullable=True))
    op.create_index('idx_user_banned', 'users', ['banned_at'])


def downgrade():
    op.drop_index('idx_user_banned', 'users')
    op.drop_column('users', 'ban_reason')
    op.drop_column('users', 'banned_at')
    
    op.drop_index('idx_payment_created', 'payments')
    op.drop_index('idx_payment_status', 'payments')
    op.drop_index('idx_payment_user', 'payments')
    op.drop_table('payments')
    
    op.drop_index('idx_audit_created', 'audit_logs')
    op.drop_index('idx_audit_entity', 'audit_logs')
    op.drop_index('idx_audit_admin', 'audit_logs')
    op.drop_table('audit_logs')
    
    op.drop_index('idx_admin_role', 'admin_users')
    op.drop_index('idx_admin_email', 'admin_users')
    op.drop_table('admin_users')
