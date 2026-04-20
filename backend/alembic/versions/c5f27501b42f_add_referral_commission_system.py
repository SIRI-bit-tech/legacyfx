"""add_referral_commission_system

Revision ID: c5f27501b42f
Revises: 1ed43c594b0c
Create Date: 2026-04-09 08:20:03.680980

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = 'c5f27501b42f'
down_revision: Union[str, Sequence[str], None] = '1ed43c594b0c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)

    if not insp.has_table('referral_commissions'):
        op.create_table('referral_commissions',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('referrer_id', sa.String(length=36), nullable=False),
            sa.Column('referred_id', sa.String(length=36), nullable=False),
            sa.Column('referral_id', sa.String(length=36), nullable=False),
            sa.Column('source_type', sa.String(length=20), nullable=False), # Using String to avoid Enum creation issues here
            sa.Column('source_amount', sa.Numeric(precision=18, scale=8), nullable=False),
            sa.Column('commission_rate', sa.Numeric(precision=10, scale=4), nullable=False),
            sa.Column('commission_amount', sa.Numeric(precision=18, scale=8), nullable=False),
            sa.Column('tier', sa.Integer(), nullable=False),
            sa.Column('status', sa.String(length=20), nullable=False, server_default='PENDING'),
            sa.Column('earned_at', sa.DateTime(), nullable=False),
            sa.Column('paid_at', sa.DateTime(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_referral_commissions_id'), 'referral_commissions', ['id'], unique=False)
        op.create_foreign_key('fk_referral_commissions_referrer_id', 'referral_commissions', 'users', ['referrer_id'], ['id'])
        op.create_foreign_key('fk_referral_commissions_referred_id', 'referral_commissions', 'users', ['referred_id'], ['id'])
        op.create_foreign_key('fk_referral_commissions_referral_id', 'referral_commissions', 'referrals', ['referral_id'], ['id'])

    if not insp.has_table('referral_payouts'):
        op.create_table('referral_payouts',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('referrer_id', sa.String(length=36), nullable=False),
            sa.Column('total_amount', sa.Numeric(precision=18, scale=8), nullable=False),
            sa.Column('commission_count', sa.Integer(), nullable=False),
            sa.Column('status', sa.String(length=20), nullable=False, server_default='PENDING'),
            sa.Column('payout_date', sa.Date(), nullable=False),
            sa.Column('paid_at', sa.DateTime(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_referral_payouts_id'), 'referral_payouts', ['id'], unique=False)
        op.create_foreign_key('fk_referral_payouts_referrer_id', 'referral_payouts', 'users', ['referrer_id'], ['id'])


def downgrade() -> None:
    op.drop_table('referral_payouts')
    op.drop_table('referral_commissions')
