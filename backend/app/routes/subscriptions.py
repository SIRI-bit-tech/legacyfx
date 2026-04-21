from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import sqlalchemy as sa
from typing import List, Optional
import uuid
from datetime import datetime, timedelta

from app.database import get_db
from app.models.user import User, UserTier
from app.models.finance import SubscriptionPlan, UserSubscription
from app.utils.auth import get_current_user
from app.schemas.finance import SubscriptionPlanResponse, UserSubscriptionResponse
from app.utils.email import send_email, create_email_template
from pydantic import BaseModel

from app.models.settings import SystemSettings
from app.models.finance import Transaction, TransactionType

router = APIRouter(prefix="/api/v1/subscriptions", tags=["subscriptions"])

class SubscribeRequest(BaseModel):
    plan_id: str

@router.get("/plans", response_model=List[SubscriptionPlanResponse])
async def list_plans(db: AsyncSession = Depends(get_db)):
    """List available subscription plans."""
    stmt = select(SubscriptionPlan).where(SubscriptionPlan.is_active == True)
    result = await db.execute(stmt)
    plans = result.scalars().all()
    return [SubscriptionPlanResponse.from_orm(p) for p in plans]

@router.get("/info")
async def get_subscription_info(db: AsyncSession = Depends(get_db)):
    """Get admin wallet information for subscription payments."""
    stmt = select(SystemSettings).where(SystemSettings.key.in_([
        "subscription_wallet_address", 
        "subscription_wallet_id",
        "subscription_wallet_qr"
    ]))
    result = await db.execute(stmt)
    settings = result.scalars().all()
    
    info = {s.key: s.value for s in settings}
    return info

@router.post("/subscribe")
async def subscribe_user(
    request: SubscribeRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Request a subscription (creates a pending state)."""
    # 1. Verify Plan (Smart matching for slugs like 'plan_pro' to 'Pro Trader')
    search_term = request.plan_id.lower().replace("plan_", "").replace("_", " ")
    stmt = select(SubscriptionPlan).where(
        sa.or_(
            SubscriptionPlan.id == request.plan_id,
            SubscriptionPlan.name.ilike(f"%{search_term}%")
        ),
        SubscriptionPlan.is_active == True
    )
    result = await db.execute(stmt)
    plan = result.scalar_one_or_none()
    
    if not plan:
        raise HTTPException(status_code=404, detail=f"Plan '{request.plan_id}' (searched as '{search_term}') not found in database.")

    # 1. Real-time Safety Check: Prevent multiple pending requests or redundant upgrades
    stmt = select(UserSubscription, SubscriptionPlan).join(
        SubscriptionPlan, sa.cast(UserSubscription.plan_id, sa.String) == sa.cast(SubscriptionPlan.id, sa.String)
    ).where(
        UserSubscription.user_id == current_user.id,
        UserSubscription.status.in_(["PENDING", "ACTIVE"])
    )
    result = await db.execute(stmt)
    existing = result.all() # There should ideally only be one

    if existing:
        for sub, p in existing:
            if sub.status == "PENDING":
                raise HTTPException(
                    status_code=400, 
                    detail=f"You already have a pending request for {p.name}. Please wait for approval."
                )
            if sub.plan_id == plan.id:
                raise HTTPException(
                    status_code=400, 
                    detail=f"You are already subscribed to {plan.name}."
                )
            # Tier Ranking check
            tier_ranks = {"BASIC": 0, "PRO": 1, "ELITE": 2, "LEGACY_MASTER": 3}
            current_rank = tier_ranks.get(current_user.tier, 0)
            requested_rank = tier_ranks.get(plan.name.upper().replace(' ', '_'), 0) # Fallback if name doesn't match
            
            # More explicit match for your plan IDs/Names
            plan_name = plan.name.upper()
            if "LEGACY MASTER" in plan_name: requested_rank = 3
            elif "ELITE" in plan_name: requested_rank = 2
            elif "PRO" in plan_name: requested_rank = 1

            if requested_rank <= current_rank:
                raise HTTPException(
                    status_code=400, 
                    detail="You are already on this or a higher plan. Downgrades must be handled via support."
                )

    # 2. Create UserSubscription in PENDING state
    sub_id = str(uuid.uuid4())
    new_sub = UserSubscription(
        id=sub_id,
        user_id=current_user.id,
        plan_id=plan.id,
        status="PENDING",
        started_at=datetime.utcnow(),
        expires_at=None # Set upon approval
    )
    
    # 3. Create a PENDING Transaction record
    tx_id = str(uuid.uuid4())
    new_tx = Transaction(
        id=tx_id,
        user_id=current_user.id,
        type=TransactionType.SUBSCRIPTION_REQUEST,
        asset_symbol="USD",
        amount=plan.price,
        description=f"Subscription request for {plan.name}",
        status="PENDING",
        reference_id=sub_id
    )
    
    db.add(new_sub)
    db.add(new_tx)
    await db.commit()
    
    # 4. Send confirmation email to user
    email_content = create_email_template(
        title="Payment Pending",
        message=f"Your payment for {plan.name} (${plan.price}) is pending confirmation. You will be notified once the payment is confirmed and your subscription is activated.",
        code=None
    )
    background_tasks.add_task(
        send_email,
        current_user.email,
        "Subscription Payment Pending - Legacy FX",
        email_content
    )
    
    return {
        "message": "Your payment is pending. You will be notified once the payment is confirmed, and an email will be sent to you.",
        "subscription_id": sub_id,
        "transaction_id": tx_id
    }

@router.get("/my-subscription")
async def get_my_subscription(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get user's current or pending subscription details."""
    stmt = select(UserSubscription, SubscriptionPlan).join(
        UserSubscription.plan
    ).where(
        UserSubscription.user_id == current_user.id,
        UserSubscription.status.in_(["ACTIVE", "PENDING"])
    ).order_by(UserSubscription.started_at.desc()).limit(1)
    result = await db.execute(stmt)
    row = result.first()
    
    if not row:
        return None
    
    subscription, plan = row
    
    return {
        "id": subscription.id,
        "plan_id": subscription.plan_id,
        "plan_name": plan.name,
        "plan_tier": plan.tier,
        "status": subscription.status,
        "started_at": subscription.started_at,
        "expires_at": subscription.expires_at
    }
