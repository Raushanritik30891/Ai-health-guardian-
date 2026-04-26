"""
alternatives.py — Same-Salt Alternative & Jan Aushadhi Router
Backed by /backend/data/alternatives.json and prices.json via data_loader.py
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.data_loader import get_alternatives, get_prices, resolve_to_generic

router = APIRouter()


class AltRequest(BaseModel):
    medicine_name: str
    budget: Optional[float] = None


@router.post("/find")
async def find_alternatives(req: AltRequest):
    name = req.medicine_name.strip()
    name_lower = name.lower()

    # Resolve to generic first
    generic = resolve_to_generic(name) or name_lower

    # Search alternatives.json
    match = None
    for entry in get_alternatives():
        brand_key = entry.get("brand_name", "").lower()
        salt_key = entry.get("salt", "").lower()
        if (generic in brand_key or brand_key in generic or
                generic in salt_key or salt_key in generic or
                name_lower in brand_key or brand_key in name_lower):
            match = entry
            break

    if not match:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No alternatives found for '{name}'. "
                "Try the generic name (e.g. Paracetamol, Metformin, Aspirin)."
            )
        )

    # Build response
    alts = match.get("alternatives", [])
    ja_name = match.get("jan_aushadhi_equivalent", "")
    ja_price = match.get("jan_aushadhi_price_approx_inr")

    # Get branded price from prices.json
    prices_data = get_prices()
    salt_key = match.get("salt", "").lower()
    branded_price = prices_data.get(salt_key, {}).get("mrp") or prices_data.get(generic, {}).get("mrp")

    return {
        "original_medicine": name,
        "salt": match.get("salt", ""),
        "jan_aushadhi_option": {
            "name": ja_name,
            "price_approx_inr": ja_price,
            "where": "Jan Aushadhi Kendra — find at janaushadhi.gov.in",
        } if ja_name else None,
        "branded_alternatives": [
            {"name": a.get("brand", ""), "manufacturer": a.get("manufacturer", "")}
            for a in alts
        ],
        "price_info": {
            "branded_price_approx_inr": branded_price,
            "jan_aushadhi_price_inr": ja_price,
            "savings_inr": round(branded_price - ja_price, 2) if branded_price and ja_price else None,
        },
        "source": match.get("source_name", "PMBJP Catalog"),
        "source_url": match.get("source_url", "https://janaushadhi.gov.in/ProductList.aspx"),
        "disclaimer": (
            "Generic medicines contain the same active ingredient (salt) and meet identical "
            "Indian Pharmacopoeia quality standards. Always verify with your pharmacist."
        ),
    }


@router.get("/search")
async def search_alternatives(q: str = ""):
    """Quick search for alternatives by medicine name."""
    if not q or len(q) < 2:
        return {"results": []}
    q_lower = q.lower().strip()
    results = []
    for entry in get_alternatives():
        brand = entry.get("brand_name", "").lower()
        salt = entry.get("salt", "").lower()
        if q_lower in brand or q_lower in salt or brand in q_lower:
            results.append({
                "brand_name": entry.get("brand_name"),
                "salt": entry.get("salt"),
                "jan_aushadhi_equivalent": entry.get("jan_aushadhi_equivalent"),
                "jan_aushadhi_price_approx_inr": entry.get("jan_aushadhi_price_approx_inr"),
                "alternatives_count": len(entry.get("alternatives", [])),
            })
        if len(results) >= 10:
            break
    return {"results": results}
