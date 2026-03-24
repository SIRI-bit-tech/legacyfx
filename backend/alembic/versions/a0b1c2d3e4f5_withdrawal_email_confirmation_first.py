"""Add email-confirm-first fields to withdrawals."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

import logging

# revision identifiers, used by Alembic.
revision: str = 'a0b1c2d3e4f5'
down_revision: Union[str, Sequence[str], None] = 'c5e1a7d2b4f9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

logger = logging.getLogger(__name__)


def upgrade() -> None:
    op.add_column('withdrawals', sa.Column('confirmation_token', sa.String(length=255), nullable=True))
    op.add_column('withdrawals', sa.Column('confirmation_expires_at', sa.DateTime(), nullable=True))

    # Extend Postgres enum with the new value.
    # ALTER TYPE ... ADD VALUE cannot be executed within a transaction block in Postgres.
    try:
        with op.get_context().autocommit_block():
            op.execute("ALTER TYPE withdrawalstatus ADD VALUE 'AWAITING_CONFIRMATION'")
    except Exception as e:
        if 'already exists' in str(e).lower():
            logger.error("Value 'AWAITING_CONFIRMATION' already exists in withdrawalstatus enum, skipping.", exc_info=e)
        else:
            logger.error("Unexpected error during ALTER TYPE withdrawalstatus.", exc_info=e)
            raise e


def downgrade() -> None:
    op.drop_column('withdrawals', 'confirmation_expires_at')
    op.drop_column('withdrawals', 'confirmation_token')

