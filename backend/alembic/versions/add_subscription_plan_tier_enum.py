"""Add tier enum to subscription_plans table

Revision ID: add_subscription_plan_tier_enum
Revises: 3b109057dce4_update_subscription_system
Create Date: 2024-04-21 08:41:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = 'add_subscription_plan_tier_enum'
down_revision = '3b109057dce4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)
    
    # Check columns in subscription_plans
    columns = [c['name'] for c in insp.get_columns('subscription_plans')]
    
    # 1. Handle usertier enum creation safely
    # Check if usertier enum already exists in the database
    enum_exists = bind.execute(sa.text("SELECT 1 FROM pg_type WHERE typname = 'usertier'")).scalar()
    user_tier_enum = postgresql.ENUM('BASIC', 'PRO', 'ELITE', 'LEGACY_MASTER', name='usertier')
    
    if not enum_exists:
        user_tier_enum.create(bind)
    
    # 2. Add or update tier column
    if 'tier' not in columns:
        if 'tier_new' in columns:
            # Handle case where a previous run failed after adding tier_new
            op.execute("UPDATE subscription_plans SET tier_new = 'BASIC' WHERE tier_new IS NULL")
            op.alter_column('subscription_plans', 'tier_new', 
                           existing_type=sa.String(length=20),
                           type_=user_tier_enum,
                           nullable=False,
                           new_column_name='tier',
                           postgresql_using="tier_new::usertier")
        else:
            # Just add the tier column directly
            op.add_column('subscription_plans', sa.Column('tier', user_tier_enum, nullable=False, server_default='BASIC'))
            # Remove server default to keep schema clean
            op.execute("ALTER TABLE subscription_plans ALTER COLUMN tier DROP DEFAULT")
    else:
        # tier already exists, ensure it is using the enum type
        # Check current type of 'tier'
        tier_col = next(c for c in insp.get_columns('subscription_plans') if c['name'] == 'tier')
        if not isinstance(tier_col['type'], postgresql.ENUM):
            op.execute("ALTER TABLE subscription_plans ALTER COLUMN tier TYPE usertier USING tier::text::usertier")

    # Clean up tier_new if it somehow exists and is redundant
    if 'tier_new' in columns and 'tier' in columns:
        op.drop_column('subscription_plans', 'tier_new')


def downgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)
    columns = [c['name'] for c in insp.get_columns('subscription_plans')]

    if 'tier' in columns:
        # Convert back to string if it was an enum
        op.alter_column('subscription_plans', 'tier',
                       existing_type=postgresql.ENUM(name='usertier'),
                       type_=sa.String(length=20),
                       nullable=False)
    
    # Note: We do NOT drop the 'usertier' enum type here because it is 
    # used by the 'users' table (tier column) and was originally defined in the baseline.
