"""add target and sensor_type to tasks

Revision ID: a1b2c3d4e5f6
Revises: e8ccbc70b686
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'a1b2c3d4e5f6'
down_revision = 'e8ccbc70b686'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('tasks', sa.Column('target', sa.Integer(), nullable=True))
    op.add_column('tasks', sa.Column('sensor_type', sa.String(20), nullable=True))


def downgrade() -> None:
    op.drop_column('tasks', 'sensor_type')
    op.drop_column('tasks', 'target')
