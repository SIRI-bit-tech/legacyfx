"""Add deposit_addresses table."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'c5e1a7d2b4f9'
down_revision: Union[str, Sequence[str], None] = '87340ad74cd1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'deposit_addresses',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('asset', sa.String(length=10), nullable=False),
        sa.Column('network', sa.String(length=50), nullable=False),
        sa.Column('address', sa.String(length=255), nullable=False),
        sa.Column('qr_code_url', sa.String(length=512), nullable=False),
        sa.Column('min_deposit', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('fee', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('asset', 'network', name='uq_deposit_addresses_asset_network'),
    )

    op.create_index(op.f('ix_deposit_addresses_asset'), 'deposit_addresses', ['asset'], unique=False)
    op.create_index(op.f('ix_deposit_addresses_network'), 'deposit_addresses', ['network'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_deposit_addresses_network'), table_name='deposit_addresses')
    op.drop_index(op.f('ix_deposit_addresses_asset'), table_name='deposit_addresses')
    op.drop_table('deposit_addresses')

