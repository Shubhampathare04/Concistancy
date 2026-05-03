"""merge_all_heads

Revision ID: 45d4907cb727
Revises: 001_add_admin_tables, a1b2c3d4e5f6, add_comprehensive_indexes, b2c3d4e5f6a7
Create Date: 2026-05-03 11:49:36.196572

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '45d4907cb727'
down_revision: Union[str, Sequence[str], None] = ('001_add_admin_tables', 'a1b2c3d4e5f6', 'add_comprehensive_indexes', 'b2c3d4e5f6a7')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
