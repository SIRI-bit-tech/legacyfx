"""
Bybit V5 Copy Trading API Client
- BingX used for fetching real master traders (no broker restriction)
- Bybit used for start/stop/status actions
"""
import hmac
import hashlib
import time
import json
import httpx
import logging
from typing import List, Dict, Any
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class BybitClient:
    """Bybit API client for copy trading (V5)"""

    def __init__(self):
        self.base_url = settings.BYBIT_API_URL or "https://api.bybit.com"
        self.api_key = settings.BYBIT_API_KEY
        self.secret_key = settings.BYBIT_SECRET_KEY
        self.recv_window = "5000"

        self.okx_base_url = "https://www.okx.com"

    # ─── Bybit Signing ───────────────────────────────────────────────────────

    def _sign_request(self, timestamp: str, body_str: str = "") -> str:
        param_str = timestamp + self.api_key + self.recv_window + body_str
        return hmac.new(
            bytes(self.secret_key, "utf-8"),
            bytes(param_str, "utf-8"),
            hashlib.sha256
        ).hexdigest()

    def _get_headers(self, timestamp: str, signature: str) -> dict:
        return {
            "X-BAPI-API-KEY": self.api_key,
            "X-BAPI-SIGN": signature,
            "X-BAPI-SIGN-TYPE": "2",
            "X-BAPI-TIMESTAMP": timestamp,
            "X-BAPI-RECV-WINDOW": self.recv_window,
            "Content-Type": "application/json"
        }

    # ─── OKX: Fetch Real Master Traders (fully public, no auth needed) ───────

    async def get_master_traders(self, limit: int = 50) -> List[dict]:
        """
        Fetch real copy traders from OKX public API.
        OKX max page size is 20, so we paginate to reach the requested limit.
        No API key, no signature, no account required.
        """
        OKX_PAGE_SIZE = 20
        url = f"{self.okx_base_url}/api/v5/copytrading/public-lead-traders"
        traders = []
        page = 1

        try:
            async with httpx.AsyncClient() as client:
                while len(traders) < limit:
                    params = {
                        "instType": "SWAP",
                        "limit": str(OKX_PAGE_SIZE),
                        "page": str(page)
                    }
                    response = await client.get(url, params=params, timeout=10.0)
                    logger.debug(f"OKX page {page} status: {response.status_code}")

                    if response.status_code != 200:
                        logger.error(f"OKX returned HTTP {response.status_code} on page {page}")
                        break

                    data = response.json()
                    if data.get("code") != "0":
                        logger.error(f"OKX API error: {data.get('msg')}")
                        break

                    ranks = data.get("data", [{}])[0].get("ranks", [])
                    if not ranks:
                        break  # No more pages

                    for item in ranks:
                        roi = float(item.get("pnlRatio") or 0) * 100
                        win_rate = float(item.get("winRatio") or 0) * 100
                        insts = item.get("traderInsts", [])
                        main_pair = insts[0].replace("-SWAP", "") if insts else "All Pairs"
                        traders.append({
                            "trader_id": str(item.get("uniqueCode")),
                            "username": item.get("nickName", "Unknown"),
                            "avatar_url": item.get("portLink", ""),
                            "roi": round(roi, 2),
                            "win_rate": round(win_rate, 2),
                            "followers": int(item.get("copyTraderNum") or 0),
                            "total_trades": int(item.get("accCopyTraderNum") or 0),
                            "aum": float(item.get("aum") or 0),
                            "monthly_return": round(roi, 2),
                            "trading_pair": main_pair,
                            "level": "Elite",
                            "source": "okx"
                        })

                    total_pages = int(data.get("data", [{}])[0].get("totalPage", 1))
                    if page >= total_pages:
                        break
                    page += 1

            logger.info(f"Fetched {len(traders)} real traders from OKX across {page} page(s)")
            return traders[:limit]

        except Exception as e:
            logger.error(f"Error in get_master_traders (OKX): {e}")
            return []

    # ─── Bybit: Copy Trading Actions ─────────────────────────────────────────

    async def start_copy_trading(self, trader_id: str, copy_config: dict) -> Dict[str, Any]:
        """Start copying a trader using Bybit V5"""
        try:
            path = "/v5/copytrading/follower/copy-contract"
            timestamp = str(int(time.time() * 1000))
            body_dict = {
                "masterTraderId": trader_id,
                "copyMode": 1 if copy_config.get("copyMode") == "fixed_amount" else 2,
                "copyAmount": str(copy_config.get("fixedAmount", "10"))
            }
            body_str = json.dumps(body_dict)
            signature = self._sign_request(timestamp, body_str)
            headers = self._get_headers(timestamp, signature)

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}{path}",
                    headers=headers,
                    content=body_str,
                    timeout=10.0
                )
                data = response.json()
                logger.debug(f"start_copy_trading response: {data}")
                if data.get("retCode") == 0:
                    return {"success": True, "copy_id": str(trader_id)}
                return {"success": False, "error": data.get("retMsg")}
        except Exception as e:
            logger.error(f"start_copy_trading error: {e}")
            return {"success": False, "error": str(e)}

    async def stop_copy_trading(self, trader_id: str) -> Dict[str, Any]:
        """Unsubscribe from a master trader"""
        try:
            path = "/v5/copytrading/follower/cancel-copy-contract"
            timestamp = str(int(time.time() * 1000))
            body_dict = {"masterTraderId": trader_id}
            body_str = json.dumps(body_dict)
            signature = self._sign_request(timestamp, body_str)
            headers = self._get_headers(timestamp, signature)

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}{path}",
                    headers=headers,
                    content=body_str,
                    timeout=10.0
                )
                data = response.json()
                logger.debug(f"stop_copy_trading response: {data}")
                return {"success": data.get("retCode") == 0, "error": data.get("retMsg")}
        except Exception as e:
            logger.error(f"stop_copy_trading error: {e}")
            return {"success": False, "error": str(e)}

    async def get_copy_trading_status(self, trader_id: str) -> Dict[str, Any]:
        """Fetch status of active copy session"""
        try:
            query_params = f"masterTraderId={trader_id}"
            path = "/v5/copytrading/order/list"
            timestamp = str(int(time.time() * 1000))
            signature = self._sign_request(timestamp, query_params)
            headers = self._get_headers(timestamp, signature)

            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}{path}?{query_params}",
                    headers=headers,
                    timeout=10.0
                )
                data = response.json()
                logger.debug(f"get_copy_trading_status response: {data}")
                return data.get("result", {})
        except Exception as e:
            logger.error(f"get_copy_trading_status error: {e}")
            return {}


# Global client instance
bybit_client = BybitClient()