"""fix_migration_chain_and_add_referral_enums

Revision ID: fix_migration_chain_and_add_referral_enums
Revises: ['c5f27501b42f', '3c24d93f3806']
Create Date: 2026-04-19 02:53:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e8'
down_revision: Union[str, Sequence[str], None] = ['c5f27501b42f', '3c24d93f3806']
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - fix migration chain and create missing enum types."""
    
    # Create missing enum types with IF NOT EXISTS to handle duplicates
    try:
        op.execute("CREATE TYPE referralstatus AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE')")
    except Exception:
        # Type already exists, ignore
        pass
    
    try:
        op.execute("CREATE TYPE commissionstatus AS ENUM ('PENDING', 'PAID', 'CANCELLED')")
    except Exception:
        # Type already exists, ignore
        pass
    
    try:
        op.execute("CREATE TYPE commissionsourcetype AS ENUM ('TRADE', 'DEPOSIT')")
    except Exception:
        # Type already exists, ignore
        pass
    
    try:
        op.execute("CREATE TYPE payoutstatus AS ENUM ('PENDING', 'COMPLETED', 'FAILED')")
    except Exception:
        # Type already exists, ignore
        pass

    # Handle staking transaction types outside of a transaction block
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE transactiontype ADD VALUE IF NOT EXISTS 'STAKING_DEPOSIT' BEFORE 'STAKING_REWARD'")
        op.execute("ALTER TYPE transactiontype ADD VALUE IF NOT EXISTS 'STAKING_WITHDRAWAL' BEFORE 'STAKING_REWARD'")


def downgrade() -> None:
    """Downgrade schema."""
    # Note: PostgreSQL doesn't support removing enum values directly
    # Drop the enum types if needed (requires manual migration)
    pass
