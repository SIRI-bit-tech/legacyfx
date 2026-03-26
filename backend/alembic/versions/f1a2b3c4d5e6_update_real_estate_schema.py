"""Update real estate schema to match ORM models

Revision ID: f1a2b3c4d5e6
Revises: a0b1c2d3e4f5
Create Date: 2026-03-25 09:48:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, Sequence[str], None] = 'a0b1c2d3e4f5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column exists on a table using the current connection."""
    bind = op.get_bind()
    insp = inspect(bind)
    columns = [c['name'] for c in insp.get_columns(table_name)]
    return column_name in columns


def _fk_constraint_name(table_name: str, column_name: str) -> str | None:
    """Find the actual FK constraint name for a given column, if any."""
    bind = op.get_bind()
    insp = inspect(bind)
    for fk in insp.get_foreign_keys(table_name):
        if column_name in fk.get('constrained_columns', []):
            return fk.get('name')
    return None


def upgrade() -> None:
    """Migrate real_estate_investments from legacy to current ORM shape,
    create real_estate_transactions and real_estate_cache tables."""

    table = 'real_estate_investments'

    # --- 1. Drop legacy FK constraint (discover its real name first) ---
    fk_name = _fk_constraint_name(table, 'property_id')
    if fk_name:
        op.drop_constraint(fk_name, table, type_='foreignkey')

    # --- 2. Add new columns if they don't exist (with temporary defaults) ---
    new_columns = {
        'external_property_id': sa.Column('external_property_id', sa.String(100), nullable=False, server_default='unknown'),
        'property_snapshot': sa.Column('property_snapshot', sa.JSON(), nullable=False, server_default='{}'),
        'tokens_owned': sa.Column('tokens_owned', sa.Integer(), server_default='0'),
        'amount_invested': sa.Column('amount_invested', sa.Numeric(18, 8), nullable=False, server_default='0'),
        'current_value': sa.Column('current_value', sa.Numeric(18, 8), nullable=False, server_default='0'),
        'monthly_income': sa.Column('monthly_income', sa.Numeric(18, 8), server_default='0'),
        'roi_percent': sa.Column('roi_percent', sa.Numeric(10, 4), server_default='0'),
        'status': sa.Column('status', sa.String(20), server_default='active'),
        'invested_at': sa.Column('invested_at', sa.DateTime(), nullable=True),
        'exited_at': sa.Column('exited_at', sa.DateTime(), nullable=True),
        'updated_at': sa.Column('updated_at', sa.DateTime(), nullable=True),
    }
    for col_name, col_def in new_columns.items():
        if not _column_exists(table, col_name):
            op.add_column(table, col_def)

    # --- 3. Backfill data from legacy columns before dropping them ---
    if _column_exists(table, 'property_id'):
        op.execute(f"UPDATE {table} SET external_property_id = property_id WHERE property_id IS NOT NULL")
    
    if _column_exists(table, 'tokens_purchased'):
        op.execute(f"UPDATE {table} SET tokens_owned = CAST(tokens_purchased AS INTEGER)")

    # Mapping earnings to both current_value and monthly_income (if earnings represents yield)
    if _column_exists(table, 'earnings'):
        op.execute(f"UPDATE {table} SET monthly_income = CAST(earnings AS NUMERIC) WHERE earnings IS NOT NULL")

    # --- 4. Drop legacy columns now that data is safe ---
    for col in ('property_id', 'tokens_purchased', 'earnings'):
        if _column_exists(table, col):
            op.drop_column(table, col)

    # Remove temporary server_defaults
    op.alter_column(table, 'external_property_id', server_default=None)
    op.alter_column(table, 'property_snapshot', server_default=None)

    # Add index on user_id if not already present
    bind = op.get_bind()
    insp = inspect(bind)
    existing_indexes = [idx['name'] for idx in insp.get_indexes(table)]
    if 'ix_real_estate_investments_user_id' not in existing_indexes:
        op.create_index('ix_real_estate_investments_user_id', table, ['user_id'])

    # --- 4. Create real_estate_transactions ---
    if not inspect(bind).has_table('real_estate_transactions'):
        op.create_table('real_estate_transactions',
            sa.Column('id', sa.String(36), primary_key=True),
            sa.Column('user_id', sa.String(), sa.ForeignKey('users.id'), nullable=False),
            sa.Column('external_property_id', sa.String(100), nullable=False),
            sa.Column('property_title', sa.String(200), nullable=False),
            sa.Column('type', sa.String(30), nullable=True),
            sa.Column('amount', sa.Numeric(18, 8), nullable=False),
            sa.Column('tokens', sa.Integer(), nullable=True),
            sa.Column('status', sa.String(20), nullable=True),
            sa.Column('payment_source', sa.String(50), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
        )
        op.create_index('ix_real_estate_transactions_user_id', 'real_estate_transactions', ['user_id'])

    # --- 5. Create real_estate_cache ---
    if not inspect(bind).has_table('real_estate_cache'):
        op.create_table('real_estate_cache',
            sa.Column('id', sa.String(36), primary_key=True),
            sa.Column('cache_key', sa.String(255), unique=True, nullable=True),
            sa.Column('data', sa.JSON(), nullable=True),
            sa.Column('fetched_at', sa.DateTime(), nullable=True),
            sa.Column('expires_at', sa.DateTime(), nullable=True),
        )
        op.create_index('ix_real_estate_cache_cache_key', 'real_estate_cache', ['cache_key'])


def downgrade() -> None:
    """Reverse the real estate schema changes."""

    # Drop new tables
    op.drop_index('ix_real_estate_cache_cache_key', table_name='real_estate_cache')
    op.drop_table('real_estate_cache')
    op.drop_index('ix_real_estate_transactions_user_id', table_name='real_estate_transactions')
    op.drop_table('real_estate_transactions')

    table = 'real_estate_investments'

    # 1. Re-add legacy columns as nullable first to avoid constraint violations
    op.add_column(table, sa.Column('property_id', sa.String(), nullable=True))
    op.add_column(table, sa.Column('tokens_purchased', sa.Float(), nullable=False, server_default='0'))
    op.add_column(table, sa.Column('earnings', sa.Float(), nullable=True))

    # 2. Backfill property_id from external_property_id before it's dropped
    op.execute(f"UPDATE {table} SET property_id = external_property_id WHERE external_property_id IS NOT NULL")
    
    # 3. Drop new columns (including external_property_id)
    for col in ('updated_at', 'exited_at', 'invested_at', 'status', 'roi_percent',
                'monthly_income', 'current_value', 'amount_invested', 'tokens_owned',
                'property_snapshot', 'external_property_id'):
        if _column_exists(table, col):
            op.drop_column(table, col)

    # 4. Now set legacy property_id to NOT NULL and add the server_default
    op.alter_column(table, 'property_id', nullable=False, server_default='')

    # 5. Re-create legacy FK
    op.create_foreign_key(
        'real_estate_investments_property_id_fkey',
        table, 'real_estate_properties', ['property_id'], ['id']
    )
