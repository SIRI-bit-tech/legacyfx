"""add_referral_uniqueness

Revision ID: 97294dc66c0b
Revises: 02f0a73ac13e
Create Date: 2026-04-19 22:02:29.836165

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '97294dc66c0b'
down_revision: Union[str, Sequence[str], None] = '02f0a73ac13e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_unique_constraint('uq_referrals_referred_id', 'referrals', ['referred_id'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('uq_referrals_referred_id', 'referrals', type_='unique')
