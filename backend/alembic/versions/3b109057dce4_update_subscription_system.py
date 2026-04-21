"""update_subscription_system

Revision ID: 3b109057dce4
Revises: 97294dc66c0b
Create Date: 2026-04-19 22:46:41.722665

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3b109057dce4'
down_revision: Union[str, Sequence[str], None] = '97294dc66c0b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add payment_proof to user_subscriptions
    op.add_column('user_subscriptions', sa.Column('payment_proof', sa.String(length=255), nullable=True))
    
    # Update Enums (using autocommit for Postgres compatibility)
    with op.get_context().autocommit_block():
        # TransactionType
        op.execute("ALTER TYPE transactiontype ADD VALUE IF NOT EXISTS 'SUBSCRIPTION_REQUEST'")
        
        # UserTier - Adding new labels
        op.execute("ALTER TYPE usertier ADD VALUE IF NOT EXISTS 'BASIC'")
        op.execute("ALTER TYPE usertier ADD VALUE IF NOT EXISTS 'PRO'")
        op.execute("ALTER TYPE usertier ADD VALUE IF NOT EXISTS 'ELITE'")
        op.execute("ALTER TYPE usertier ADD VALUE IF NOT EXISTS 'LEGACY_MASTER'")

    # Migrate existing user data to new tiers
    op.execute("UPDATE users SET tier = 'BASIC' WHERE tier = 'BRONZE'")
    op.execute("UPDATE users SET tier = 'PRO' WHERE tier = 'SILVER'")
    op.execute("UPDATE users SET tier = 'ELITE' WHERE tier = 'GOLD'")
    op.execute("UPDATE users SET tier = 'LEGACY_MASTER' WHERE tier IN ('PLATINUM', 'DIAMOND')")

    # Seed system settings for admin wallet
    import uuid
    # Check if settings already exist before inserting
    op.execute(
        "INSERT INTO system_settings (id, key, value, description) "
        "VALUES ('" + str(uuid.uuid4()) + "', 'subscription_wallet_address', 'NOT_SET', 'Admin wallet address for subscription payments') "
        "ON CONFLICT (key) DO NOTHING"
    )
    op.execute(
        "INSERT INTO system_settings (id, key, value, description) "
        "VALUES ('" + str(uuid.uuid4()) + "', 'subscription_wallet_id', 'NOT_SET', 'Admin wallet ID/Network for subscription payments') "
        "ON CONFLICT (key) DO NOTHING"
    )


def downgrade() -> None:
    # Note: Enum values cannot be removed in Postgres without recreating the type
    op.drop_column('user_subscriptions', 'payment_proof')
    
    op.execute("DELETE FROM system_settings WHERE key IN ('subscription_wallet_address', 'subscription_wallet_id')")
