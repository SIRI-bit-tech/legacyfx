import httpx
import asyncio
import json
import logging
import hashlib
from datetime import datetime, timedelta
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

class RealEstateService:
    @staticmethod
    async def get_cache(db: AsyncSession, cache_key: str) -> Optional[Dict[str, Any]]:
        stmt = select(RealEstateCache).where(
            RealEstateCache.cache_key == cache_key,
            RealEstateCache.expires_at > datetime.utcnow()
        )
        result = await db.execute(stmt)
        cache_item = result.scalar_one_or_none()
        return cache_item.data if cache_item else None

    @staticmethod
    async def set_cache(db: AsyncSession, cache_key: str, data: Any):
        expires_at = datetime.utcnow() + timedelta(seconds=settings.REAL_ESTATE_CACHE_TTL)
<<<<<<< Updated upstream
        
        stmt = select(RealEstateCache).where(RealEstateCache.cache_key == cache_key)
        result = await db.execute(stmt)
        existing = result.scalar_one_or_none()
        
        if existing:
            existing.data = data
            existing.expires_at = expires_at
            existing.fetched_at = datetime.utcnow()
        else:
            new_cache = RealEstateCache(
                cache_key=cache_key,
                data=data,
                expires_at=expires_at
            )
            db.add(new_cache)
        
        await db.commit()

    @staticmethod
    def _generate_cache_key(prefix: str, params: Dict[str, Any]) -> str:
        param_str = json.dumps(params, sort_keys=True)
        param_hash = hashlib.md5(param_str.encode()).hexdigest()
        return f"{prefix}:{param_hash}"

    # --- Realty in US (RapidAPI) ---
    @staticmethod
    async def fetch_realty(filters: PropertyFilters, db: AsyncSession) -> List[Dict[str, Any]]:
        if not settings.RAPIDAPI_KEY:
            return []
            
        # Realty v3/list is a POST request
        url = f"{settings.RAPIDAPI_REALTY_BASE_URL}/properties/v3/list"
        headers = {
            "X-RapidAPI-Key": settings.RAPIDAPI_KEY,
            "X-RapidAPI-Host": settings.RAPIDAPI_REALTY_HOST,
            "Content-Type": "application/json"
        }
        
        # Build Request Body
        body = {
            "limit": 20,
            "offset": (filters.page - 1) * 20,
=======
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
        headers = {"X-RapidAPI-Key": settings.RAPIDAPI_KEY, "X-RapidAPI-Host": settings.RAPIDAPI_REALTY_HOST, "Content-Type": "application/json"}
        
        body = {
            "limit": 20, "offset": (filters.page - 1) * 20,
>>>>>>> Stashed changes
            "status": ["for_sale"] if filters.type != 'rent' else ["for_rent"],
            "sort": {"direction": "desc", "field": "list_date"}
        }
        
<<<<<<< Updated upstream
        # Add Location Filter
        if filters.city:
            body["city"] = filters.city
        elif filters.state:
            body["state_code"] = filters.state
        else:
            # DEFAULT: If no search, show Los Angeles or Miami to avoid empty page
            body["postal_code"] = "90001" 
            
        cache_key = RealEstateService._generate_cache_key("realtyus:list", body)
        cached_data = await RealEstateService.get_cache(db, cache_key)
        if cached_data:
            return cached_data

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(url, json=body, headers=headers, timeout=12.0)
                if resp.status_code == 200:
                    data = resp.json()
                    # Actual properties are usually in data['data']['home_search']['results']
                    results = data.get('data', {}).get('home_search', {}).get('results', [])
                    await RealEstateService.set_cache(db, cache_key, results)
                    return results
                else:
                    logger.error(f"RapidAPI Realty returned status {resp.status_code}")
                    return []
=======
        # Mapping frontend filters to RapidAPI body
        if filters.priceRange and filters.priceRange != 'any':
            price_map = {'under100k': {"max": 100000}, '100k-300k': {"min": 100000, "max": 300000}, '300k-500k': {"min": 300000, "max": 500000}, '500kplus': {"min": 500000}}
            if filters.priceRange in price_map: body["list_price"] = price_map[filters.priceRange]
        
        if filters.property_type and filters.property_type != 'any':
            type_map = {'Apartment': ["condo"], 'House': ["single_family", "multi_family"], 'Commercial': ["commercial"], 'Land': ["land"]}
            if filters.property_type in type_map: body["prop_type"] = type_map[filters.property_type]

        if filters.min_beds and filters.min_beds != 'any':
            try: body["beds"] = {"min": int(filters.min_beds)}
            except: pass

        if filters.city: body["city"] = filters.city
        elif filters.state: body["state_code"] = filters.state
        else: body["postal_code"] = "90210"

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(url, json=body, headers=headers, timeout=15.0)
                if resp.status_code == 200:
                    return resp.json().get('data', {}).get('home_search', {}).get('results', [])
                return []
>>>>>>> Stashed changes
        except Exception as e:
            logger.error(f"RapidAPI Realty error: {e}")
            return []

<<<<<<< Updated upstream
    # --- RealtyAPI.io ---
    @staticmethod
    async def fetch_realty_api(params: Dict[str, Any], db: AsyncSession) -> List[Dict[str, Any]]:
        if not settings.REALTY_API_KEY:
            return []
            
        cache_key = RealEstateService._generate_cache_key("realtyapi:search", params)
        cached_data = await RealEstateService.get_cache(db, cache_key)
        if cached_data:
            return cached_data

        url = f"{settings.REALTY_API_BASE_URL}/properties"
        headers = {"x-realtyapi-key": settings.REALTY_API_KEY}
        
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, params=params, headers=headers, timeout=10.0)
                if resp.status_code == 200:
                    data = resp.json()
                    results = data.get('listings', []) if isinstance(data, dict) else data
                    await RealEstateService.set_cache(db, cache_key, results)
                    return results
                else:
                    return []
        except Exception as e:
            logger.error(f"RealtyAPI.io error: {e}")
            return []

    # --- Normalizers ---
=======
    # --- RealtyAPI.io (DISABLED FOR NOW) ---
    @staticmethod
    async def fetch_realty_api(filters: PropertyFilters, db: AsyncSession) -> List[Dict[str, Any]]:
        """Temporarily commented out due to domain resolution issues"""
        return []
        # if not settings.REALTY_API_KEY: return []
        # params = {"city": filters.city or "Miami", "limit": 20}
        # headers = {"x-realtyapi-key": settings.REALTY_API_KEY}
        # try:
        #     async with httpx.AsyncClient() as client:
        #         resp = await client.get(settings.REALTY_API_BASE_URL + "/properties", params=params, headers=headers, timeout=15.0)
        #         if resp.status_code == 200:
        #             data = resp.json()
        #             return data.get('results', []) if isinstance(data, dict) else (data if isinstance(data, list) else [])
        #         return []
        # except Exception as e:
        #     logger.error(f"RealtyAPI.io error: {e}")
        #     return []

>>>>>>> Stashed changes
    @staticmethod
    def normalize_realty(raw: Dict[str, Any]) -> UnifiedProperty:
        addr = raw.get('location', {}).get('address', {})
        location = f"{addr.get('line', '')}, {addr.get('city', '')}, {addr.get('state_code', '')}"
        desc = raw.get('description', {})
<<<<<<< Updated upstream
        
        # Image URL extraction
        photos = raw.get('primary_photo', {}).get('href')
        images = [photos] if photos else []
        
        return UnifiedProperty(
            id=f"ru_{raw.get('property_id', str(uuid.uuid4()))}",
            source="Realtor.com",
            type="For Sale" if raw.get('status') == 'for_sale' else "For Rent",
            title=location,
            address=location,
            city=addr.get('city', ''),
            state=addr.get('state_code', ''),
            price=float(raw.get('list_price', 0)) if raw.get('list_price') else 0,
            price_per_month=float(raw.get('list_price', 0)) if raw.get('status') == 'for_rent' else None,
            bedrooms=desc.get('beds'),
            bathrooms=desc.get('baths'),
            area_sqft=desc.get('sqft'),
            images=images,
            estimated_roi=9.2,
            estimated_monthly_rent=0,
            property_type=desc.get('type'),
            listed_at=raw.get('list_date')
=======
        photo = raw.get('primary_photo', {}).get('href')
        
        price = float(raw.get('list_price', 0)) if raw.get('list_price') else 0
        # Calculate Legendary ROI: 18.5% annual yield + 10% projection
        roi = 18.5
        # Monthly rent based on ROI (price * 18.5% / 12)
        monthly_rent = (price * (roi / 100.0)) / 12.0
        
        return UnifiedProperty(
            id=f"ru_{raw.get('property_id', str(uuid.uuid4()))}", source="Realtor.com",
            type="For Sale" if raw.get('status') == 'for_sale' else "For Rent",
            title=location if location.strip(',') else "Premium Home", address=location, city=addr.get('city', ''), state=addr.get('state_code', ''),
            price=price,
            price_per_month=float(raw.get('list_price', 0)) if raw.get('status') == 'for_rent' else None,
            bedrooms=desc.get('beds'), bathrooms=desc.get('baths'), area_sqft=desc.get('sqft'),
            images=[photo] if photo else [], estimated_roi=roi, estimated_monthly_rent=monthly_rent, property_type=desc.get('type'), listed_at=raw.get('list_date')
>>>>>>> Stashed changes
        )

    @staticmethod
    def normalize_realty_api(raw: Dict[str, Any]) -> UnifiedProperty:
<<<<<<< Updated upstream
        return UnifiedProperty(
            id=f"ra_{raw.get('id', str(uuid.uuid4()))}",
            source="RealtyAPI",
            type="For Sale",
            title=raw.get('address', 'Property'),
            address=raw.get('address', ''),
            city=raw.get('city', ''),
            state=raw.get('state', ''),
            price=float(raw.get('price', 0)),
            price_per_month=None,
            bedrooms=raw.get('bedrooms'),
            bathrooms=raw.get('bathrooms'),
            area_sqft=raw.get('sqft'),
            images=raw.get('images', []),
            estimated_roi=float(raw.get('roi', 7.8)),
            estimated_monthly_rent=float(raw.get('rent_estimate', 0)),
            property_type=raw.get('type'),
            listed_at=raw.get('listed_at')
        )

    # --- Aggregator ---
    @staticmethod
    async def get_listings(filters: PropertyFilters, db: AsyncSession) -> ListingsResponse:
        # Prepare params for RealtyAPI.io
        ra_params = {}
        if filters.city:
            ra_params['city'] = filters.city
        elif filters.state:
            ra_params['state'] = filters.state
            
        # Parallel fetch
        tasks = [
            RealEstateService.fetch_realty(filters, db),
            RealEstateService.fetch_realty_api(ra_params, db)
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        ru_data = results[0] if len(results) > 0 and not isinstance(results[0], Exception) else []
        ra_data = results[1] if len(results) > 1 and not isinstance(results[1], Exception) else []
        
        unified = []
        for item in ru_data:
            if isinstance(item, dict):
                unified.append(RealEstateService.normalize_realty(item))
        for item in ra_data:
            if isinstance(item, dict):
                unified.append(RealEstateService.normalize_realty_api(item))
            
        unique_listings = {}
        for item in unified:
            addr_key = item.address.lower().strip()
            if addr_key and addr_key not in unique_listings:
                unique_listings[addr_key] = item
        
        sorted_listings = sorted(unique_listings.values(), key=lambda x: x.price if x.price > 0 else 999999999)
        
        # Filter by price if needed
        if filters.min_price:
            sorted_listings = [l for l in sorted_listings if l.price >= filters.min_price]
        if filters.max_price:
            sorted_listings = [l for l in sorted_listings if l.price <= filters.max_price]
            
        start = (filters.page - 1) * filters.limit
        end = start + filters.limit
        page_items = sorted_listings[start:end]
        
        return ListingsResponse(
            listings=page_items,
            total=len(sorted_listings),
            page=filters.page,
            has_more=end < len(sorted_listings)
        )

    @staticmethod
    async def get_property_by_id(property_id: str, db: AsyncSession) -> Optional[UnifiedProperty]:
        if property_id.startswith("ru_"):
            raw_id = property_id[3:]
            # Detail fetch (Simplified)
            data = await RealEstateService.fetch_realty(PropertyFilters(page=1, limit=1), db) # Fix: need better detail fetch
            for item in data:
                if item.get('property_id') == raw_id:
                    return RealEstateService.normalize_realty(item)
=======
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
    async def get_listings(filters: PropertyFilters, db: AsyncSession) -> ListingsResponse:
        tasks = [RealEstateService.fetch_realty(filters, db), RealEstateService.fetch_realty_api(filters, db)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        ru_data = results[0] if not isinstance(results[0], Exception) else []
        ra_data = results[1] if not isinstance(results[1], Exception) else []
        unified = [RealEstateService.normalize_realty(i) for i in ru_data if isinstance(i, dict)]
        unified += [RealEstateService.normalize_realty_api(i) for i in ra_data if isinstance(i, dict)]
        unique = {}
        for item in unified:
            if item.address.lower() not in unique: unique[item.address.lower()] = item
        sorted_list = sorted(unique.values(), key=lambda x: x.price if x.price > 0 else 999999999)
        start = (filters.page - 1) * filters.limit
        page_items = sorted_list[start : start + filters.limit]
        return ListingsResponse(listings=page_items, total=len(unique), page=filters.page, has_more=(start + filters.limit) < len(unique))

    @staticmethod
    async def get_property_by_id(property_id: str, db: AsyncSession) -> Optional[UnifiedProperty]:
        data = await RealEstateService.fetch_realty(PropertyFilters(page=1, limit=50), db)
        for item in data:
            if f"ru_{item.get('property_id')}" == property_id: return RealEstateService.normalize_realty(item)
>>>>>>> Stashed changes
        return None

    @staticmethod
    async def invest_in_property(user_id: str, request: InvestRequest, db: AsyncSession, ably_client=None) -> Dict[str, Any]:
<<<<<<< Updated upstream
        stmt = select(User).where(User.id == user_id)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        if not user: raise Exception("User not found")
        if Decimal(str(user.account_balance)) < Decimal(str(request.amount)): raise Exception("Insufficient balance")
        
        prop = await RealEstateService.get_property_by_id(request.property_id, db)
        if not prop: raise Exception("Property not found")
            
        user.account_balance = float(Decimal(str(user.account_balance)) - Decimal(str(request.amount)))
        investment = RealEstateInvestment(
            user_id=user_id, external_property_id=request.property_id,
            property_snapshot=prop.dict(), tokens_owned=request.tokens,
            amount_invested=Decimal(str(request.amount)), current_value=Decimal(str(request.amount)),
            monthly_income=Decimal(str(prop.estimated_monthly_rent or 0)) * Decimal(str(request.tokens / 1000)),
            roi_percent=Decimal(str(prop.estimated_roi or 9.0)),
            status=InvestmentStatus.ACTIVE
        )
        db.add(investment)
        tx = RealEstateTransaction(
            user_id=user_id, external_property_id=request.property_id, property_title=prop.title,
            type=RealEstateTransactionType.FRACTIONAL_INVESTMENT, amount=Decimal(str(request.amount)),
            tokens=request.tokens, status=TransactionStatus.COMPLETED, payment_source="platform_balance"
        )
        db.add(tx)
        await db.commit()
        if ably_client: await ably_client.publish(f"funds:{user_id}", {"balance": float(user.account_balance)})
        return {"id": investment.id, "status": investment.status, "amount_invested": float(investment.amount_invested)}

    @staticmethod
    async def exit_investment(investment_id: str, user_id: str, db: AsyncSession, ably_client=None) -> Dict[str, Any]:
        stmt = select(RealEstateInvestment).where(RealEstateInvestment.id == investment_id, RealEstateInvestment.user_id == user_id, RealEstateInvestment.status == InvestmentStatus.ACTIVE)
        result = await db.execute(stmt)
        inv = result.scalar_one_or_none()
        if not inv: raise Exception("Active investment not found")
        
        exit_val = inv.current_value
        inv.status = InvestmentStatus.EXITED
        inv.exited_at = datetime.utcnow()
        stmt = select(User).where(User.id == user_id)
        u = (await db.execute(stmt)).scalar_one_or_none()
        u.account_balance = float(Decimal(str(u.account_balance)) + exit_val)
        tx = RealEstateTransaction(user_id=user_id, external_property_id=inv.external_property_id, property_title=inv.property_snapshot.get('title', 'Prop'), type=RealEstateTransactionType.EXIT, amount=exit_val, tokens=inv.tokens_owned, status=TransactionStatus.COMPLETED, payment_source="platform_balance")
        db.add(tx)
        await db.commit()
        if ably_client: await ably_client.publish(f"funds:{user_id}", {"balance": float(u.account_balance)})
        return {"success": True, "exit_value": float(exit_val)}

    @staticmethod
    async def get_portfolio(user_id: str, db: AsyncSession) -> Dict[str, Any]:
        result = await db.execute(select(RealEstateInvestment).where(RealEstateInvestment.user_id == user_id))
        investments = result.scalars().all()
        active = [i for i in investments if i.status == InvestmentStatus.ACTIVE]
=======
        user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
        if not user or Decimal(str(user.account_balance)) < Decimal(str(request.amount)): raise Exception("Insufficient funds")
        prop = await RealEstateService.get_property_by_id(request.property_id, db)
        if not prop: raise Exception("Property not found")
        user.account_balance -= float(request.amount)
        inv = RealEstateInvestment(user_id=user_id, external_property_id=request.property_id, property_snapshot=prop.dict(), tokens_owned=request.tokens, amount_invested=Decimal(str(request.amount)), current_value=Decimal(str(request.amount)), monthly_income=Decimal(str(prop.estimated_monthly_rent or 0)) * Decimal(str(request.tokens / 1000)), roi_percent=Decimal(str(prop.estimated_roi or 18.5)), status=InvestmentStatus.ACTIVE)
        db.add(inv)
        db.add(RealEstateTransaction(user_id=user_id, external_property_id=request.property_id, property_title=prop.title, type=RealEstateTransactionType.FRACTIONAL_INVESTMENT, amount=Decimal(str(request.amount)), tokens=request.tokens, status=TransactionStatus.COMPLETED, payment_source="platform_balance"))
        await db.commit()
        if ably_client: await ably_client.publish(f"funds:{user_id}", {"balance": float(user.account_balance)})
        return {"id": inv.id, "status": inv.status, "amount_invested": float(inv.amount_invested)}

    @staticmethod
    async def exit_investment(investment_id: str, user_id: str, db: AsyncSession, ably_client=None) -> Dict[str, Any]:
        inv = (await db.execute(select(RealEstateInvestment).where(RealEstateInvestment.id == investment_id, RealEstateInvestment.user_id == user_id, RealEstateInvestment.status == InvestmentStatus.ACTIVE))).scalar_one_or_none()
        if not inv: raise Exception("Not found")
        v = inv.current_value
        inv.status = InvestmentStatus.EXITED
        u = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
        u.account_balance += float(v)
        db.add(RealEstateTransaction(user_id=user_id, external_property_id=inv.external_property_id, property_title=inv.property_snapshot.get('title', 'Prop'), type=RealEstateTransactionType.EXIT, amount=v, tokens=inv.tokens_owned, status=TransactionStatus.COMPLETED, payment_source="platform_balance"))
        await db.commit()
        if ably_client: await ably_client.publish(f"funds:{user_id}", {"balance": float(u.account_balance)})
        return {"success": True}

    @staticmethod
    async def get_portfolio(user_id: str, db: AsyncSession) -> Dict[str, Any]:
        invs = (await db.execute(select(RealEstateInvestment).where(RealEstateInvestment.user_id == user_id))).scalars().all()
        active = [i for i in invs if i.status == InvestmentStatus.ACTIVE]
>>>>>>> Stashed changes
        total_v = sum(i.current_value for i in active)
        monthly_i = sum(i.monthly_income for i in active)
        total_inv = sum(i.amount_invested for i in active)
        avg_r = sum(i.roi_percent * (i.amount_invested / total_inv) for i in active) if total_inv > 0 else 0
        return {
            "total_value": float(total_v), "active_count": len(active), "monthly_income": float(monthly_i), "avg_roi": float(avg_r),
<<<<<<< Updated upstream
            "investments": [{"id": i.id, "title": i.property_snapshot.get('title', 'Prop'), "location": f"{i.property_snapshot.get('city', '')}, {i.property_snapshot.get('state', '')}", "amount_invested": float(i.amount_invested), "current_value": float(i.current_value), "monthly_income": float(i.monthly_income), "roi": float(i.roi_percent), "status": i.status, "tokens": i.tokens_owned, "invested_at": i.invested_at} for i in investments]
=======
            "investments": [{"id": i.id, "title": i.property_snapshot.get('title', 'Prop'), "location": f"{i.property_snapshot.get('city', '')}, {i.property_snapshot.get('state', '')}", "amount_invested": float(i.amount_invested), "current_value": float(i.current_value), "monthly_income": float(i.monthly_income), "roi": float(i.roi_percent), "status": i.status, "tokens": i.tokens_owned, "invested_at": i.invested_at} for i in invs]
>>>>>>> Stashed changes
        }
