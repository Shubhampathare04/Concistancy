"""Add security enhancements to users table

Revision ID: security_enhancements_001
Revises: 
Create Date: 2025-01-XX

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'security_enhancements_001'
down_revision = None  # Update this to your latest migration
branch_labels = None
depends_on = None


def upgrade():
    # Add email verification columns
    op.add_column('users', sa.Column('email_verified', sa.Boolean(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('verification_token', sa.String(255), nullable=True))
    
    # Add account lockout columns
    op.add_column('users', sa.Column('failed_login_attempts', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('locked_until', sa.DateTime(), nullable=True))
    
    # Add index on verification_token for faster lookups
    op.create_index('idx_users_verification_token', 'users', ['verification_token'])


def downgrade():
    # Remove indexes
    op.drop_index('idx_users_verification_token', table_name='users')
    
    # Remove columns
    op.drop_column('users', 'locked_until')
    op.drop_column('users', 'failed_login_attempts')
    op.drop_column('users', 'verification_token')
    op.drop_column('users', 'email_verified')
