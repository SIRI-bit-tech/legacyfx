from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.finance import Deposit, Withdrawal, DepositStatus, WithdrawalStatus
from app.models.trading import ExecutionTrade
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/v1/transactions", tags=["transactions"])


def map_deposit_status(status: DepositStatus) -> str:
    if status == DepositStatus.CONFIRMED:
        return "confirmed"
    if status == DepositStatus.PENDING:
        return "pending"
    return "failed"


def map_withdraw_status(status: WithdrawalStatus) -> str:
    if status == WithdrawalStatus.AWAITING_CONFIRMATION:
        return "awaiting_confirmation"
    if status in [WithdrawalStatus.PENDING_APPROVAL, WithdrawalStatus.PENDING_2FA, WithdrawalStatus.PROCESSING]:
        return "pending"
    if status == WithdrawalStatus.COMPLETED:
        return "filled"
    if status in [WithdrawalStatus.REJECTED, WithdrawalStatus.CANCELLED]:
        return "failed"
    return "pending"


@router.get("/recent")
async def recent_transactions(
    userId: str,
    limit: int = 5,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get a combined recent list of deposits, withdrawals and trades."""
    if userId != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    dep_stmt = (
        select(Deposit)
        .where(Deposit.user_id == userId)
        .order_by(Deposit.created_at.desc())
        .limit(limit)
    )
    with_stmt = (
        select(Withdrawal)
        .where(Withdrawal.user_id == userId)
        .order_by(Withdrawal.created_at.desc())
        .limit(limit)
    )
    trade_stmt = (
        select(ExecutionTrade)
        .where(ExecutionTrade.user_id == userId)
        .order_by(ExecutionTrade.created_at.desc())
        .limit(limit)
    )

    dep_result = await db.execute(dep_stmt)
    with_result = await db.execute(with_stmt)
    trade_result = await db.execute(trade_stmt)

    deposits = dep_result.scalars().all()
    withdrawals = with_result.scalars().all()
    trades = trade_result.scalars().all()

    combined: List[dict] = []

    for d in deposits:
        combined.append(
            {
                "type": "deposit",
                "asset": d.asset_symbol,
                "amount": d.amount,
                "status": map_deposit_status(d.status),
                "network": d.blockchain_network or "On-chain",
                "date": d.created_at.isoformat() if d.created_at else None,
                "txHash": d.transaction_hash or "",
                "_created": d.created_at,
            }
        )

    for w in withdrawals:
        combined.append(
            {
                "type": "withdraw",
                "asset": w.asset_symbol,
                "amount": w.amount,
                "status": map_withdraw_status(w.status),
                "network": w.blockchain_network or "On-chain",
                "date": w.created_at.isoformat() if w.created_at else None,
                "txHash": w.transaction_hash or "",
                "_created": w.created_at,
            }
        )

    for t in trades:
        combined.append(
            {
                "type": "trade",
                "asset": t.symbol,
                "amount": t.quantity,
                "status": "filled",
                "network": "Internal",
                "date": t.created_at.isoformat() if t.created_at else None,
                "txHash": "",
                "_created": t.created_at,
            }
        )

    combined.sort(key=lambda x: x.get("_created") or 0, reverse=True)

    # Strip helper field and apply final limit across all types.
    items = combined[:limit]
    return {
        "transactions": [
            {
                "type": i["type"],
                "asset": i["asset"],
                "amount": i["amount"],
                "status": i["status"],
                "network": i["network"],
                "date": i["date"],
                "txHash": i["txHash"],
            }
            for i in items
        ]
    }

