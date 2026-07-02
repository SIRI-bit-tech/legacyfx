"""Add last_earning_payout_at to Deposit

Revision ID: 5e998db78a1f
Revises: 4f0ae272dfb6
Create Date: 2026-07-01 18:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5e998db78a1f'
down_revision: Union[str, Sequence[str], None] = '4f0ae272dfb6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('deposits', sa.Column('last_earning_payout_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('deposits', 'last_earning_payout_at')
