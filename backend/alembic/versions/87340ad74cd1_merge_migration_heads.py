"""merge migration heads

Revision ID: 87340ad74cd1
Revises: ('9be8109dd8e2', 'ea4b4aecf90c')
Create Date: 2026-03-23 09:12:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '87340ad74cd1'
down_revision: Union[str, Sequence[str], None] = ('9be8109dd8e2', 'ea4b4aecf90c')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Merge heads - no actual schema changes needed here."""
    pass


def downgrade() -> None:
    """Reverts merge - simply a placeholder."""
    pass
