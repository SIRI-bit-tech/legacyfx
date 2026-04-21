"""Add tier enum to subscription_plans table

Revision ID: add_subscription_plan_tier_enum
Revises: 3b109057dce4_update_subscription_system
Create Date: 2024-04-21 08:41:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_subscription_plan_tier_enum'
down_revision = '3b109057dce4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add tier column as nullable String first
    op.add_column('subscription_plans', sa.Column('tier_new', sa.String(length=20), nullable=True))
    
    # Backfill existing rows with BASIC as default
    op.execute("UPDATE subscription_plans SET tier_new = 'BASIC' WHERE tier_new IS NULL")
    
    # Create the UserTier enum type
    user_tier_enum = postgresql.ENUM('BASIC', 'PRO', 'ELITE', 'LEGACY_MASTER', name='usertier')
    user_tier_enum.create(op.get_bind())
    
    # Drop old tier column and rename new one
    op.drop_column('subscription_plans', 'tier')
    op.alter_column('subscription_plans', 'tier_new', 
                   existing_type=sa.String(length=20),
                   type_=user_tier_enum,
                   nullable=False,
                   new_column_name='tier')


def downgrade() -> None:
    # Add old tier column as String
    op.add_column('subscription_plans', sa.Column('tier_old', sa.String(length=20), nullable=True))
    
    # Copy data from enum to string
    op.execute("UPDATE subscription_plans SET tier_old = tier::text")
    
    # Drop enum column and rename old one
    op.drop_column('subscription_plans', 'tier')
    op.alter_column('subscription_plans', 'tier_old',
                   existing_type=postgresql.ENUM(name='usertier'),
                   type_=sa.String(length=20),
                   nullable=False,
                   new_column_name='tier')
    
    # Drop the enum type
    user_tier_enum = postgresql.ENUM(name='usertier')
    user_tier_enum.drop(op.get_bind())
