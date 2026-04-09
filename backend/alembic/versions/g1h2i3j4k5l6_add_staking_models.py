"""Add staking models (products, positions, rewards)

Revision ID: g1h2i3j4k5l6
Revises: f1a2b3c4d5e6
Create Date: 2026-04-15 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = 'g1h2i3j4k5l6'
down_revision: Union[str, Sequence[str], None] = 'f1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create staking tables for products, positions, and rewards."""
    
    bind = op.get_bind()
    insp = inspect(bind)
    
    # Check if tables already exist
    if not insp.has_table('staking_products'):
        op.create_table('staking_products',
            sa.Column('id', sa.String(36), primary_key=True, nullable=False),
            sa.Column('asset_symbol', sa.String(10), nullable=False),
            sa.Column('staking_type', sa.String(20), nullable=False),
            sa.Column('annual_percentage_yield', sa.Float(), nullable=False),
            sa.Column('min_stake_amount', sa.Float(), nullable=False),
            sa.Column('lock_period_days', sa.Integer(), nullable=False),
            sa.Column('payout_frequency', sa.String(20), nullable=False),
            sa.Column('pool_capacity_amount', sa.Float(), nullable=True),
            sa.Column('current_total_staked', sa.Float(), nullable=False, server_default='0'),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
        )
        op.create_index('ix_staking_products_id', 'staking_products', ['id'])
        op.create_index('ix_staking_products_staking_type', 'staking_products', ['staking_type'])
        op.create_index('ix_staking_products_is_active', 'staking_products', ['is_active'])

    if not insp.has_table('staking_positions'):
        op.create_table('staking_positions',
            sa.Column('id', sa.String(36), primary_key=True, nullable=False),
            sa.Column('user_id', sa.String(36), nullable=False),
            sa.Column('pool_id', sa.String(36), nullable=False),
            sa.Column('amount_staked', sa.Float(), nullable=False),
            sa.Column('total_earned_amount', sa.Float(), nullable=False, server_default='0'),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
            sa.Column('earned_until_date', sa.DateTime(), nullable=True),
            sa.Column('last_payout_at', sa.DateTime(), nullable=True),
            sa.Column('closed_at', sa.DateTime(), nullable=True),
            sa.Column('started_at', sa.DateTime(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.ForeignKey('user_id', 'users.id', name='fk_staking_positions_user_id'),
            sa.ForeignKey('pool_id', 'staking_products.id', name='fk_staking_positions_pool_id'),
        )
        op.create_index('ix_staking_positions_user_id', 'staking_positions', ['user_id'])
        op.create_index('ix_staking_positions_pool_id', 'staking_positions', ['pool_id'])
        op.create_index('ix_staking_positions_is_active', 'staking_positions', ['is_active'])

    if not insp.has_table('staking_rewards'):
        op.create_table('staking_rewards',
            sa.Column('id', sa.String(36), primary_key=True, nullable=False),
            sa.Column('position_id', sa.String(36), nullable=False),
            sa.Column('amount', sa.Float(), nullable=False),
            sa.Column('status', sa.String(20), nullable=False, server_default='ACCRUED'),
            sa.Column('reward_type', sa.String(30), nullable=False),
            sa.Column('earned_on_date', sa.DateTime(), nullable=False),
            sa.Column('paid_on_date', sa.DateTime(), nullable=True),
            sa.Column('claimed_on_date', sa.DateTime(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.ForeignKey('position_id', 'staking_positions.id', name='fk_staking_rewards_position_id'),
        )
        op.create_index('ix_staking_rewards_position_id', 'staking_rewards', ['position_id'])
        op.create_index('ix_staking_rewards_status', 'staking_rewards', ['status'])

    # Add staking transaction types if not already present
    # This is done in a separate migration for finance.py enum changes


def downgrade() -> None:
    """Remove staking tables."""
    
    bind = op.get_bind()
    insp = inspect(bind)
    
    if insp.has_table('staking_rewards'):
        op.drop_index('ix_staking_rewards_status', table_name='staking_rewards')
        op.drop_index('ix_staking_rewards_position_id', table_name='staking_rewards')
        op.drop_table('staking_rewards')
    
    if insp.has_table('staking_positions'):
        op.drop_index('ix_staking_positions_is_active', table_name='staking_positions')
        op.drop_index('ix_staking_positions_pool_id', table_name='staking_positions')
        op.drop_index('ix_staking_positions_user_id', table_name='staking_positions')
        op.drop_table('staking_positions')
    
    if insp.has_table('staking_products'):
        op.drop_index('ix_staking_products_is_active', table_name='staking_products')
        op.drop_index('ix_staking_products_staking_type', table_name='staking_products')
        op.drop_index('ix_staking_products_id', table_name='staking_products')
        op.drop_table('staking_products')
