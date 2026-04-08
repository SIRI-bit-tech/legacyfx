import uuid
import logging
from datetime import datetime
from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.user import User
from app.models.finance import ColdStorageVault, Transaction, TransactionType
from app.utils.market import get_live_price

logger = logging.getLogger(__name__)


class ColdStorageError(Exception):
    """Base class for cold storage errors."""
    pass


class VaultNotFoundError(ColdStorageError):
    """Raised when vault doesn't exist."""
    pass


class InsufficientBalanceError(ColdStorageError):
    """Raised when vault balance is insufficient."""
    pass


class VaultLockedError(ColdStorageError):
    """Raised when vault is locked."""
    pass


class ColdStorageService:
    """Service for managing user cold storage vaults."""

    @staticmethod
    async def get_or_create_vault(user_id: str, db: AsyncSession) -> ColdStorageVault:
        """Get existing vault or create new one for user.
        
        NOTE: This should be called within a transaction context.
        No independent commit is done here - transaction is managed by caller.
        """
        # Use FOR UPDATE to lock the row if it exists (prevents race conditions)
        stmt = select(ColdStorageVault).where(
            ColdStorageVault.user_id == user_id
        ).with_for_update()
        result = await db.execute(stmt)
        vault = result.scalar_one_or_none()

        if not vault:
            vault = ColdStorageVault(
                id=str(uuid.uuid4()),
                user_id=user_id,
                asset_symbol="MIXED",
                balance=0.0,
                is_locked=True,
            )
            db.add(vault)
            # Do NOT commit here - let the caller manage the transaction

        return vault

    @staticmethod
    async def get_vault_data(user_id: str, db: AsyncSession) -> dict:
        """Get vault overview with USD conversion (read-only)."""
        # Get vault - should already exist from deposit/withdraw/toggle operations
        stmt = select(ColdStorageVault).where(ColdStorageVault.user_id == user_id)
        result = await db.execute(stmt)
        vault = result.scalar_one_or_none()

        if not vault:
            # Create default vault if it doesn't exist (for first-time access to page)
            async with db.begin():
                vault = ColdStorageVault(
                    id=str(uuid.uuid4()),
                    user_id=user_id,
                    asset_symbol="MIXED",
                    balance=0.0,
                    is_locked=True,
                )
                db.add(vault)
                await db.flush()

        # Get all cold storage transactions for this user to calculate asset breakdown
        stmt = select(Transaction).where(
            Transaction.user_id == user_id,
            Transaction.type.in_([
                TransactionType.COLD_STORAGE_DEPOSIT,
                TransactionType.COLD_STORAGE_WITHDRAWAL
            ])
        ).order_by(Transaction.created_at)

        result = await db.execute(stmt)
        transactions = result.scalars().all()

        # Calculate asset balances
        asset_balances: dict = {}
        for tx in transactions:
            if tx.type == TransactionType.COLD_STORAGE_DEPOSIT:
                asset_balances[tx.asset_symbol] = asset_balances.get(tx.asset_symbol, 0) + tx.amount
            else:  # COLD_STORAGE_WITHDRAWAL
                asset_balances[tx.asset_symbol] = asset_balances.get(tx.asset_symbol, 0) - tx.amount

        # Convert to USD
        assets = []
        total_usd = 0.0
        for symbol, balance in asset_balances.items():
            if balance > 0:
                price = await get_live_price(symbol)
                usd_value = balance * price
                total_usd += usd_value
                assets.append({
                    "asset_symbol": symbol,
                    "balance": balance,
                    "usd_value": usd_value
                })

        return {
            "id": vault.id,
            "user_id": vault.user_id,
            "total_balance_usd": total_usd,
            "is_locked": vault.is_locked,
            "last_withdrawal_at": vault.last_withdrawal_at,
            "created_at": vault.created_at,
            "assets": assets
        }

    @staticmethod
    async def deposit_to_vault(
        user_id: str,
        asset_symbol: str,
        amount: float,
        db: AsyncSession,
        ably_service=None
    ) -> dict:
        """Move funds from trading account to cold storage vault."""

        if amount <= 0:
            raise ColdStorageError("Amount must be greater than 0")

        # Use transaction block with row locks to prevent race conditions
        async with db.begin():
            # Get user with FOR UPDATE lock to prevent concurrent modifications
            stmt = select(User).where(User.id == user_id).with_for_update()
            result = await db.execute(stmt)
            user = result.scalar_one_or_none()

            if not user:
                raise ColdStorageError("User not found")

            if user.trading_balance < amount:
                raise InsufficientBalanceError(
                    f"Insufficient trading balance. Available: {user.trading_balance}, Required: {amount}"
                )

            # Get vault with FOR UPDATE lock
            stmt = select(ColdStorageVault).where(
                ColdStorageVault.user_id == user_id
            ).with_for_update()
            result = await db.execute(stmt)
            vault = result.scalar_one_or_none()

            if not vault:
                # Create vault within transaction (with lock)
                vault = ColdStorageVault(
                    id=str(uuid.uuid4()),
                    user_id=user_id,
                    asset_symbol="MIXED",
                    balance=0.0,
                    is_locked=True,
                )
                db.add(vault)
                await db.flush()  # Ensure vault has ID before using it

            # Get price for USD amount
            price = await get_live_price(asset_symbol)
            usd_amount = amount * price

            # Create transaction record
            transaction_id = str(uuid.uuid4())
            transaction = Transaction(
                id=transaction_id,
                user_id=user_id,
                type=TransactionType.COLD_STORAGE_DEPOSIT,
                asset_symbol=asset_symbol,
                amount=amount,
                usd_amount=usd_amount,
                description=f"Deposit {amount} {asset_symbol} to cold storage",
                reference_id=vault.id,
                status="COMPLETED"
            )
            db.add(transaction)

            # Update user trading balance (under lock)
            user.trading_balance -= amount

            # NOTE: We do NOT update vault.balance here because:
            # 1. Transactions already record the asset amount and usd_amount
            # 2. get_vault_data() calculates balances from transaction history
            # 3. vault.balance is metadata-only for this vault

            # Transaction is committed when exiting the async with block

        # Broadcast via Ably if available (outside transaction)
        if ably_service:
            try:
                await ably_service.publish(
                    f"user:{user_id}:cold-storage",
                    {
                        "type": "deposit",
                        "asset_symbol": asset_symbol,
                        "amount": amount,
                        "usd_amount": usd_amount,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                )
            except Exception as e:
                logger.error(f"Failed to broadcast cold storage deposit: {e}")

        return {
            "success": True,
            "message": f"Successfully deposited {amount} {asset_symbol} to cold storage",
            "vault_id": vault.id,
            "new_vault_balance": vault.balance,
            "transaction_id": transaction_id
        }

    @staticmethod
    async def withdraw_from_vault(
        user_id: str,
        asset_symbol: str,
        amount: float,
        db: AsyncSession,
        ably_service=None
    ) -> dict:
        """Move funds from cold storage vault to trading account."""

        if amount <= 0:
            raise ColdStorageError("Amount must be greater than 0")

        # Use transaction block with row locks to prevent race conditions
        async with db.begin():
            # Get vault with FOR UPDATE lock
            stmt = select(ColdStorageVault).where(
                ColdStorageVault.user_id == user_id
            ).with_for_update()
            result = await db.execute(stmt)
            vault = result.scalar_one_or_none()

            if not vault:
                raise VaultNotFoundError("Vault not found")

            if vault.is_locked:
                raise VaultLockedError("Vault is locked. Unlock it before withdrawing.")

            # Get user with FOR UPDATE lock
            stmt = select(User).where(User.id == user_id).with_for_update()
            result = await db.execute(stmt)
            user = result.scalar_one_or_none()

            if not user:
                raise ColdStorageError("User not found")

            # Calculate available balance in vault for this asset (read all transactions with lock)
            stmt = select(Transaction).where(
                Transaction.user_id == user_id,
                Transaction.asset_symbol == asset_symbol,
                Transaction.type.in_([
                    TransactionType.COLD_STORAGE_DEPOSIT,
                    TransactionType.COLD_STORAGE_WITHDRAWAL
                ])
            ).order_by(Transaction.created_at)

            result = await db.execute(stmt)
            transactions = result.scalars().all()

            available_balance = 0.0
            for tx in transactions:
                if tx.type == TransactionType.COLD_STORAGE_DEPOSIT:
                    available_balance += tx.amount
                else:
                    available_balance -= tx.amount

            if available_balance < amount:
                raise InsufficientBalanceError(
                    f"Insufficient {asset_symbol} in vault. Available: {available_balance}"
                )

            # Get price for USD amount
            price = await get_live_price(asset_symbol)
            usd_amount = amount * price

            # Create transaction record
            transaction_id = str(uuid.uuid4())
            transaction = Transaction(
                id=transaction_id,
                user_id=user_id,
                type=TransactionType.COLD_STORAGE_WITHDRAWAL,
                asset_symbol=asset_symbol,
                amount=amount,
                usd_amount=usd_amount,
                description=f"Withdraw {amount} {asset_symbol} from cold storage",
                reference_id=vault.id,
                status="COMPLETED"
            )
            db.add(transaction)

            # Update user trading balance (under lock)
            user.trading_balance += amount
            vault.last_withdrawal_at = datetime.utcnow()

            # NOTE: We do NOT update vault.balance here because:
            # 1. Transactions already record the asset amount and usd_amount
            # 2. get_vault_data() calculates balances from transaction history
            # 3. vault.balance is metadata-only for this vault

            # Transaction is committed when exiting the async with block

        # Broadcast via Ably (outside transaction)
        if ably_service:
            try:
                await ably_service.publish(
                    f"user:{user_id}:cold-storage",
                    {
                        "type": "withdrawal",
                        "asset_symbol": asset_symbol,
                        "amount": amount,
                        "usd_amount": usd_amount,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                )
            except Exception as e:
                logger.error(f"Failed to broadcast cold storage withdrawal: {e}")

        return {
            "success": True,
            "message": f"Successfully withdrew {amount} {asset_symbol} from cold storage",
            "remaining_vault_balance": vault.balance,
            "transaction_id": transaction_id
        }

    @staticmethod
    async def toggle_vault_lock(user_id: str, is_locked: bool, db: AsyncSession) -> dict:
        """Toggle vault lock status."""
        async with db.begin():
            # Get vault with FOR UPDATE lock
            stmt = select(ColdStorageVault).where(
                ColdStorageVault.user_id == user_id
            ).with_for_update()
            result = await db.execute(stmt)
            vault = result.scalar_one_or_none()

            if not vault:
                raise VaultNotFoundError("Vault not found")

            vault.is_locked = is_locked
            # Transaction is committed when exiting the async with block

        status = "locked" if is_locked else "unlocked"
        return {
            "success": True,
            "is_locked": vault.is_locked,
            "message": f"Vault successfully {status}"
        }

    @staticmethod
    async def get_vault_transactions(
        user_id: str,
        page: int = 1,
        limit: int = 10,
        db: AsyncSession = None
    ) -> Tuple[List[dict], int]:
        """Get paginated transaction history for user's vault."""

        # Get total count
        stmt = select(func.count(Transaction.id)).where(
            Transaction.user_id == user_id,
            Transaction.type.in_([
                TransactionType.COLD_STORAGE_DEPOSIT,
                TransactionType.COLD_STORAGE_WITHDRAWAL
            ])
        )
        result = await db.execute(stmt)
        total = result.scalar()

        # Get paginated results
        stmt = select(Transaction).where(
            Transaction.user_id == user_id,
            Transaction.type.in_([
                TransactionType.COLD_STORAGE_DEPOSIT,
                TransactionType.COLD_STORAGE_WITHDRAWAL
            ])
        ).order_by(Transaction.created_at.desc()).offset((page - 1) * limit).limit(limit)

        result = await db.execute(stmt)
        transactions = result.scalars().all()

        return [
            {
                "id": tx.id,
                "transaction_type": tx.type.value,
                "asset_symbol": tx.asset_symbol,
                "amount": tx.amount,
                "usd_amount": tx.usd_amount,
                "vault_balance_after": 0.0,  # Could be calculated from cumulative history
                "created_at": tx.created_at
            }
            for tx in transactions
        ], total
