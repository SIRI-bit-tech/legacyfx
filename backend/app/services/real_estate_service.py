import httpx
import asyncio
import json
import logging
import hashlib
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from decimal import Decimal
import uuid

from app.config import settings
from app.models.real_estate import RealEstateInvestment, RealEstateTransaction, RealEstateCache, InvestmentStatus, RealEstateTransactionType, TransactionStatus
from app.models.user import User
from app.schemas.real_estate import UnifiedProperty, PropertyFilters, ListingsResponse, InvestRequest
from app.models.finance import Transaction

logger = logging.getLogger(__name__)
 
class RealEstateError(Exception):
    """Base class for all real estate service errors."""
    pass

class InvestmentNotFoundError(RealEstateError):
    """Raised when a specific investment cannot be found."""
    pass

class InsufficientFundsError(RealEstateError):
    """Raised when the user doesn't have enough balance."""
    pass

class UserNotFoundError(RealEstateError):
    """Raised when a specific user cannot be found."""
    pass

class PropertyNotFoundError(RealEstateError):
    """Raised when an external property is not found."""
    pass


class RealEstateService:
    # Static mappings moved to class level to reduce function complexity
    PRICE_MAP = {
        'under100k': {"max": 100000},
        '100k-300k': {"min": 100000, "max": 300000},
        '300k-500k': {"min": 300000, "max": 500000},
        '500kplus': {"min": 500000}
    }
    TYPE_MAP = {
        'Apartment': ["condo"],
        'House': ["single_family", "multi_family"],
        'Commercial': ["commercial"],
        'Land': ["land"]
    }

    @staticmethod
    def _parse_location(filters: PropertyFilters, body: Dict[str, Any]):
        """Helper to parse city/state into the request body without bloating main function."""
        if filters.city:
            if ',' in filters.city:
                parts = [p.strip() for p in filters.city.split(',')]
                body["city"] = parts[0]
                if len(parts) > 1:
                    body["state_code"] = parts[1].upper()[:2]
            else:
                body["city"] = filters.city
        elif filters.state:
            body["state_code"] = filters.state.upper()[:2]
        else:
            # Fallback to NY hub for variety if no location is specified
            body["state_code"] = "NY"

    @staticmethod
    def _build_realty_request_body(filters: PropertyFilters) -> Dict[str, Any]:
        """Maps PropertyFilters to the API request format."""
        limit = filters.limit if filters.limit else 20
        body = {
            "limit": limit,
            "offset": (filters.page - 1) * limit,
            "status": ["for_sale"] if filters.type != 'rent' else ["for_rent"],
            "sort": {"direction": "desc", "field": "list_date"}
        }
        
        # Pull from class-level mappings
        # Map price filters: precedence to specific min/max over legacy priceRange
        if filters.min_price or filters.max_price:
            body["list_price"] = {}
            if filters.min_price:
                body["list_price"]["min"] = int(filters.min_price)
            if filters.max_price:
                body["list_price"]["max"] = int(filters.max_price)
        elif filters.priceRange in RealEstateService.PRICE_MAP:
            body["list_price"] = RealEstateService.PRICE_MAP[filters.priceRange]
        if filters.property_type in RealEstateService.TYPE_MAP:
            body["prop_type"] = RealEstateService.TYPE_MAP[filters.property_type]
            
        if filters.min_beds and str(filters.min_beds).lower() != 'any':
            try:
                body["beds"] = {"min": int(filters.min_beds)}
            except (ValueError, TypeError):
                pass
        
        RealEstateService._parse_location(filters, body)
        return body
    @staticmethod
    async def get_cache(db: AsyncSession, cache_key: str) -> Optional[Dict[str, Any]]:
        stmt = select(RealEstateCache).where(
            RealEstateCache.cache_key == cache_key,
            RealEstateCache.expires_at > datetime.now(timezone.utc)
        )
        result = await db.execute(stmt)
        cache_item = result.scalar_one_or_none()
        return cache_item.data if cache_item else None

    @staticmethod
    async def set_cache(db: AsyncSession, cache_key: str, data: Any):
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=settings.REAL_ESTATE_CACHE_TTL)
        stmt = select(RealEstateCache).where(RealEstateCache.cache_key == cache_key)
        existing = (await db.execute(stmt)).scalar_one_or_none()
        if existing:
            existing.data = data
            existing.expires_at = expires_at
        else:
            db.add(RealEstateCache(cache_key=cache_key, data=data, expires_at=expires_at))
        await db.commit()

    # --- Realty in US (RapidAPI) ---
    @staticmethod
    async def fetch_realty(filters: PropertyFilters, db: AsyncSession) -> List[Dict[str, Any]]:
        if not settings.RAPIDAPI_KEY: return []
        url = f"{settings.RAPIDAPI_REALTY_BASE_URL}/properties/v3/list"
        headers = {
            "X-RapidAPI-Key": settings.RAPIDAPI_KEY,
            "X-RapidAPI-Host": settings.RAPIDAPI_REALTY_HOST,
            "Content-Type": "application/json"
        }
        
        body = RealEstateService._build_realty_request_body(filters)


        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(url, json=body, headers=headers, timeout=15.0)
                if resp.status_code == 200:
                    return resp.json().get('data', {}).get('home_search', {}).get('results', [])
                return []
        except Exception as e:
            logger.error(f"RapidAPI Realty error: {e}")
            return []

    # --- RealtyAPI.io (DISABLED FOR NOW) ---
    @staticmethod
    async def fetch_realty_api(filters: PropertyFilters, db: AsyncSession) -> List[Dict[str, Any]]:
        return []

    @staticmethod
    def normalize_realty(raw: Dict[str, Any]) -> UnifiedProperty:
        addr = (raw.get('location') or {}).get('address') or {}
        location = f"{addr.get('line', '')}, {addr.get('city', '')}, {addr.get('state_code', '')}"
        desc = raw.get('description') or {}
        photo = (raw.get('primary_photo') or {}).get('href')
        
        price = float(raw.get('list_price', 0)) if raw.get('list_price') else 0
        roi = 18.5
        monthly_rent = (price * (roi / 100.0)) / 12.0
        
        return UnifiedProperty(
            id=f"ru_{raw.get('property_id', str(uuid.uuid4()))}", source="Realtor.com",
            type="For Sale" if raw.get('status') == 'for_sale' else "For Rent",
            title=location if location.strip(',') else "Premium Home", address=location, city=addr.get('city', ''), state=addr.get('state_code', ''),
            price=price,
            price_per_month=float(raw.get('list_price', 0)) if raw.get('status') == 'for_rent' else None,
            bedrooms=desc.get('beds'), bathrooms=desc.get('baths'), area_sqft=desc.get('sqft'),
            images=[photo] if photo else [], estimated_roi=roi, estimated_monthly_rent=monthly_rent, property_type=desc.get('type'), listed_at=raw.get('list_date')
        )

    @staticmethod
    def normalize_realty_api(raw: Dict[str, Any]) -> UnifiedProperty:
        price = float(raw.get('price', 0))
        roi = 18.5
        monthly_rent = (price * (roi / 100.0)) / 12.0
        return UnifiedProperty(
            id=f"ra_{raw.get('id', str(uuid.uuid4()))}", source="RealtyAPI", type="For Sale",
            title=raw.get('address', 'Property'), address=raw.get('address', ''), city=raw.get('city', ''), state=raw.get('state', ''),
            price=price, price_per_month=None, bedrooms=raw.get('bedrooms'), bathrooms=raw.get('bathrooms'),
            area_sqft=raw.get('sqft'), images=raw.get('images', []) or [], estimated_roi=roi, estimated_monthly_rent=monthly_rent, property_type=raw.get('type'), listed_at=raw.get('listed_at')
        )

    @staticmethod
    async def _fetch_mixed_hubs(filters: PropertyFilters, db: AsyncSession) -> List[UnifiedProperty]:
        """Helper to fetch from multiple state hubs when no location is specified."""
        hubs = ["NY", "CA", "TX", "FL", "IL", "GA", "OH", "PA", "MI", "MO"]
        
        # Calculate a large enough pool for accurate cross-hub sorting/dedupe
        # Fetching everything up to the current page's offset, capped at 250
        page = max(filters.page or 1, 1)
        limit = min(max(filters.limit or 8, 1), 50)
        pool_size = min(page * limit, 250)
        
        hub_tasks = []
        for state in hubs:
            hub_filters = filters.model_copy()
            hub_filters.state = state
            hub_filters.page = 1
            hub_filters.limit = pool_size  # Ensure each source provides enough for a full page-pool
            hub_tasks.append(RealEstateService.fetch_realty(hub_filters, db))
        
        api_filters = filters.model_copy()
        api_filters.page = 1
        api_filters.limit = pool_size
        hub_tasks.append(RealEstateService.fetch_realty_api(api_filters, db))
        
        all_results = await asyncio.gather(*hub_tasks, return_exceptions=True)
        
        unified = []
        for i, res in enumerate(all_results):
            if not isinstance(res, list):
                continue
            
            # The last task in hub_tasks is fetch_realty_api
            if i < len(all_results) - 1:
                unified.extend([RealEstateService.normalize_realty(item) for item in res if isinstance(item, dict)])
            else:
                unified.extend([RealEstateService.normalize_realty_api(item) for item in res if isinstance(item, dict)])
            
        return unified

    @staticmethod
    async def _fetch_targeted(filters: PropertyFilters, db: AsyncSession) -> List[UnifiedProperty]:
        """Helper to fetch results for a specific location search."""
        # Ensure we have a pool of results from page 1 to the current needed end
        # Clamped to avoid hammering upstream on deep-paginated requests
        page = max(filters.page or 1, 1)
        limit = min(max(filters.limit or 8, 1), 50)
        pool_size = min(page * limit, 250)
        
        pool_filters = filters.model_copy()
        pool_filters.page = 1
        pool_filters.limit = pool_size

        tasks = [
            RealEstateService.fetch_realty(pool_filters, db), 
            RealEstateService.fetch_realty_api(pool_filters, db)
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        ru_data = results[0] if not isinstance(results[0], Exception) else []
        ra_data = results[1] if not isinstance(results[1], Exception) else []
        
        unified = [RealEstateService.normalize_realty(i) for i in ru_data if isinstance(i, dict)]
        unified += [RealEstateService.normalize_realty_api(i) for i in ra_data if isinstance(i, dict)]
        return unified

    @staticmethod
    async def get_listings(filters: PropertyFilters, db: AsyncSession) -> ListingsResponse:
        has_location = bool(filters.city or filters.state or filters.search)
        
        if not has_location:
            unified = await RealEstateService._fetch_mixed_hubs(filters, db)
        else:
            unified = await RealEstateService._fetch_targeted(filters, db)
        
        # Deduplicate by address and sort by price
        unique = {}
        for item in unified:
            addr_key = item.address.lower().strip()
            if addr_key and addr_key not in unique:
                unique[addr_key] = item
        
        sorted_list = sorted(unique.values(), key=lambda x: x.price if x.price > 0 else 999999999)
        
        # Paginate the results locally
        limit = filters.limit if filters.limit else 8
        start = (filters.page - 1) * limit
        page_items = sorted_list[start : start + limit]
        
        return ListingsResponse(
            listings=page_items,
            total=len(unique),
            page=filters.page,
            has_more=(start + limit) < len(unique)
        )

    @staticmethod
    async def fetch_property_detail(raw_property_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a single property directly from the RapidAPI detail endpoint."""
        if not settings.RAPIDAPI_KEY:
            return None
        url = f"{settings.RAPIDAPI_REALTY_BASE_URL}/properties/v3/detail"
        headers = {
            "X-RapidAPI-Key": settings.RAPIDAPI_KEY,
            "X-RapidAPI-Host": settings.RAPIDAPI_REALTY_HOST,
            "Content-Type": "application/json"
        }
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    url, json={"property_id": raw_property_id}, headers=headers, timeout=15.0
                )
                if resp.status_code == 200:
                    home = resp.json().get("data", {}).get("home", None)
                    return home
        except Exception as e:
            logger.error(f"RapidAPI property detail error for {raw_property_id}: {e}")
        return None

    @staticmethod
    async def get_property_by_id(property_id: str, db: AsyncSession) -> Optional[UnifiedProperty]:
        # Extract the raw API property_id from our prefixed id (e.g. "ru_12345" -> "12345" or "ra_123" -> "123")
        raw_id = property_id.split("_", 1)[1] if "_" in property_id else property_id

        # Strategy 1: Direct detail endpoint lookup (most reliable)
        detail = await RealEstateService.fetch_property_detail(raw_id)
        if detail and detail.get("property_id"):
            return RealEstateService.normalize_realty(detail)

        # Strategy 2: Paginated fallback — scan up to 5 pages of listings
        max_pages = 5
        for page in range(1, max_pages + 1):
            data = await RealEstateService.fetch_realty(PropertyFilters(page=page, limit=50), db)
            if not data:
                break
            for item in data:
                if str(item.get("property_id")) == raw_id:
                    return RealEstateService.normalize_realty(item)

        return None

    @staticmethod
    async def invest_in_property(user_id: str, request: InvestRequest, db: AsyncSession, ably_client=None) -> Dict[str, Any]:
        # Fetch property info before locking (read-only, no race risk)
        prop = await RealEstateService.get_property_by_id(request.property_id, db)
        if not prop:
            raise PropertyNotFoundError(f"Property {request.property_id} not found")

        async with db.begin():
            # Lock the user row to serialize concurrent balance mutations
            user = (await db.execute(
                select(User).where(User.id == user_id).with_for_update()
            )).scalar_one_or_none()
            if not user or Decimal(str(user.account_balance)) < Decimal(str(request.amount)):
                raise InsufficientFundsError("Insufficient funds for investment")

            user.account_balance -= float(request.amount)

            # Authoritative token calculation: 1,000 total shares per property
            total_property_price = Decimal(str(prop.price or 1))
            invested_amount_dec = Decimal(str(request.amount))
            total_shares = Decimal("1000")
            computed_tokens = (invested_amount_dec / total_property_price) * total_shares

            est_monthly_rent = Decimal(str(prop.estimated_monthly_rent or 0))
            computed_monthly_income = est_monthly_rent * (computed_tokens / total_shares)

            inv = RealEstateInvestment(
                user_id=user_id,
                external_property_id=request.property_id,
                property_snapshot=prop.dict(),
                tokens_owned=float(computed_tokens),
                amount_invested=invested_amount_dec,
                current_value=invested_amount_dec,
                monthly_income=computed_monthly_income,
                roi_percent=Decimal(str(prop.estimated_roi or 18.5)),
                status=InvestmentStatus.ACTIVE
            )
            db.add(inv)
            db.add(RealEstateTransaction(
                user_id=user_id,
                external_property_id=request.property_id,
                property_title=prop.title,
                type=RealEstateTransactionType.FRACTIONAL_INVESTMENT,
                amount=invested_amount_dec,
                tokens=float(computed_tokens),
                status=TransactionStatus.COMPLETED,
                payment_source="platform_balance"
            ))
            # Transaction commits at the end of the `async with db.begin()` block

        # Publish after successful commit so Ably reflects committed state
        if ably_client:
            try:
                await ably_client.publish(f"funds:{user_id}", {"balance": float(user.account_balance)})
            except Exception as e:
                logger.error(f"Failed to publish balance update to Ably for user {user_id}: {e}")
        return {"id": inv.id, "status": inv.status, "amount_invested": float(inv.amount_invested), "tokens_owned": inv.tokens_owned, "created_at": inv.invested_at}

    @staticmethod
    async def exit_investment(investment_id: str, user_id: str, db: AsyncSession, ably_client=None) -> Dict[str, Any]:
        async with db.begin():
            # Lock the investment row to prevent double-exit
            inv = (await db.execute(
                select(RealEstateInvestment)
                .where(
                    RealEstateInvestment.id == investment_id,
                    RealEstateInvestment.user_id == user_id,
                    RealEstateInvestment.status == InvestmentStatus.ACTIVE
                )
                .with_for_update()
            )).scalar_one_or_none()
            if not inv:
                raise InvestmentNotFoundError(f"Investment {investment_id} not found or already exited")

            v = inv.current_value
            inv.status = InvestmentStatus.EXITED

            # Lock the user row to serialize balance mutations
            u = (await db.execute(
                select(User).where(User.id == user_id).with_for_update()
            )).scalar_one_or_none()
            
            if not u:
                logger.error(f"User {user_id} not found during exit_investment transaction")
                raise UserNotFoundError(f"User {user_id} not found")
            
            u.account_balance += float(v)

            db.add(RealEstateTransaction(
                user_id=user_id,
                external_property_id=inv.external_property_id,
                property_title=inv.property_snapshot.get('title', 'Prop'),
                type=RealEstateTransactionType.EXIT,
                amount=v,
                tokens=inv.tokens_owned,
                status=TransactionStatus.COMPLETED,
                payment_source="platform_balance"
            ))
            # Transaction commits at the end of the `async with db.begin()` block

        # Publish after successful commit
        if ably_client:
            try:
                await ably_client.publish(f"funds:{user_id}", {"balance": float(u.account_balance)})
            except Exception as e:
                logger.error(f"Failed to publish balance update to Ably for user {user_id}: {e}")
        return {"success": True}

    @staticmethod
    async def get_portfolio(user_id: str, db: AsyncSession) -> Dict[str, Any]:
        invs = (await db.execute(select(RealEstateInvestment).where(RealEstateInvestment.user_id == user_id))).scalars().all()
        active = [i for i in invs if i.status == InvestmentStatus.ACTIVE]
        total_v = sum(i.current_value for i in active)
        monthly_i = sum(i.monthly_income for i in active)
        total_inv = sum(i.amount_invested for i in active)
        avg_r = sum(i.roi_percent * (i.amount_invested / total_inv) for i in active) if total_inv > 0 else 0
        return {
            "total_value": float(total_v), "active_count": len(active), "monthly_income": float(monthly_i), "avg_roi": float(avg_r),
            "investments": [{"id": i.id, "title": i.property_snapshot.get('title', 'Prop'), "location": f"{i.property_snapshot.get('city', '')}, {i.property_snapshot.get('state', '')}", "amount_invested": float(i.amount_invested), "current_value": float(i.current_value), "monthly_income": float(i.monthly_income), "roi": float(i.roi_percent), "status": i.status, "tokens": i.tokens_owned, "invested_at": i.invested_at} for i in invs]
        }

    @staticmethod
    async def get_transactions(user_id: str, page: int, limit: int, db: AsyncSession) -> Tuple[List[Dict[str, Any]], int]:
        stmt = select(RealEstateTransaction).where(RealEstateTransaction.user_id == user_id).order_by(RealEstateTransaction.created_at.desc())
        count_stmt = select(func.count()).select_from(RealEstateTransaction).where(RealEstateTransaction.user_id == user_id)
        
        total = (await db.execute(count_stmt)).scalar() or 0
        txs = (await db.execute(stmt.offset((page - 1) * limit).limit(limit))).scalars().all()
        
        return [{"id": str(tx.id), "type": tx.type, "asset_name": tx.property_title, "amount": float(tx.amount), "status": tx.status, "created_at": tx.created_at} for tx in txs], total
