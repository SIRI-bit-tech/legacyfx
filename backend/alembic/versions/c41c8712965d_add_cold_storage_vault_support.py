"""add_cold_storage_vault_support

Revision ID: c41c8712965d
Revises: 04af1d8ef041
Create Date: 2026-04-06 11:33:07.105534

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'c41c8712965d'
down_revision: Union[str, Sequence[str], None] = '04af1d8ef041'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - add cold storage vault support only."""
    # Add foreign key constraint to copied_signals table
    op.create_foreign_key('fk_copied_signals_user_id_users', 'copied_signals', 'users', ['user_id'], ['id'])


def downgrade() -> None:
    """Downgrade schema - remove cold storage vault support only."""
    # Remove the foreign key constraint we added
    op.drop_constraint('fk_copied_signals_user_id_users', 'copied_signals', type_='foreignkey')
