"""Add staking transaction types to TransactionType enum

Revision ID: h2i3j4k5l6m7
Revises: g1h2i3j4k5l6
Create Date: 2026-04-15 10:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'h2i3j4k5l6m7'
down_revision: Union[str, Sequence[str], None] = 'g1h2i3j4k5l6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add STAKING_DEPOSIT and STAKING_WITHDRAWAL to TransactionType enum."""
    
    # Add enum values outside established transactions using native idempotent checks
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE transactiontype ADD VALUE IF NOT EXISTS 'STAKING_DEPOSIT' BEFORE 'STAKING_REWARD'")
        op.execute("ALTER TYPE transactiontype ADD VALUE IF NOT EXISTS 'STAKING_WITHDRAWAL' BEFORE 'STAKING_REWARD'")


def downgrade() -> None:
    """Remove STAKING_DEPOSIT and STAKING_WITHDRAWAL from TransactionType enum.
    
    Note: PostgreSQL doesn't support removing enum values directly.
    This is a known limitation. A manual migration may be needed if downgrading.
    """
    pass
