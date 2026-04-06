"""add_cold_storage_transaction_types

Revision ID: d7f5e9c2b1a3
Revises: c41c8712965d
Create Date: 2026-04-06 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


revision: str = 'd7f5e9c2b1a3'
down_revision: Union[str, Sequence[str], None] = 'c41c8712965d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - add new enum values to transactiontype."""
    connection = op.get_bind()
    
    # Add new enum values to the transactiontype enum
    # Using raw SQL with error handling in case values already exist
    try:
        connection.execute(text("ALTER TYPE transactiontype ADD VALUE 'COLD_STORAGE_DEPOSIT'"))
    except Exception as e:
        if "already exists" not in str(e):
            raise
    
    try:
        connection.execute(text("ALTER TYPE transactiontype ADD VALUE 'COLD_STORAGE_WITHDRAWAL'"))
    except Exception as e:
        if "already exists" not in str(e):
            raise


def downgrade() -> None:
    """Downgrade schema - remove new enum values from transactiontype."""
    # PostgreSQL doesn't allow removing enum values directly from the type
    # We would need a complex recreation of the type to remove values
    # For this reason, we leave downgrade as a NO-OP
    pass
