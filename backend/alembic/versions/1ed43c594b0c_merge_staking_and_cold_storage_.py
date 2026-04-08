"""Merge staking and cold storage migrations

Revision ID: 1ed43c594b0c
Revises: h2i3j4k5l6m7, d7f5e9c2b1a3
Create Date: 2026-04-08 11:45:19.447072

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1ed43c594b0c'
down_revision: Union[str, Sequence[str], None] = ('h2i3j4k5l6m7', 'd7f5e9c2b1a3')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
