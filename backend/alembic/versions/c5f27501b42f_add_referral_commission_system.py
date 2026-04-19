"""add_referral_commission_system

Revision ID: c5f27501b42f
Revises: 1ed43c594b0c
Create Date: 2026-04-09 08:20:03.680980

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c5f27501b42f'
down_revision: Union[str, Sequence[str], None] = '1ed43c594b0c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
