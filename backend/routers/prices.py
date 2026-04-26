"""
prices.py — Medicine Price Comparison Router
Backed by /backend/data/prices.json + alternatives.json via data_loader.py
"""
from fastapi import APIRouter, HTTPException
from services.data_loader import get_prices, get_alternatives, resolve_to_generic

router = APIRouter()


@router.get("/compare/{name}")
async def compare(name: str):
    name_lower = name.lower().strip()
    generic = resolve_to_generic(name) or name_lower

    prices_data = get_prices()

    # Try to find price entry by generic or name
    price_entry = None
    for key, val in prices_data.items():
        if not isinstance(val, dict):
            continue
        if generic in key.lower() or key.lower() in generic or name_lower in key.lower():
            price_entry = (key, val)
            break

    # Try to find Jan Aushadhi price from alternatives.json
    ja_price = None
    ja_name = None
    for entry in get_alternatives():
        salt = entry.get("salt", "").lower()
        brand = entry.get("brand_name", "").lower()
        if generic in salt or salt in generic or generic in brand or brand in generic:
            ja_price = entry.get("jan_aushadhi_price_approx_inr")
            ja_name = entry.get("jan_aushadhi_equivalent")
            break

    if not price_entry and not ja_price:
        raise HTTPException(
            status_code=404,
            detail=f"Price data not found for '{name}'. Try the generic name (e.g. Paracetamol, Metformin)."
        )

    mrp = price_entry[1].get("mrp") if price_entry else None
    platforms = {}
    if price_entry:
        pe = price_entry[1]
        for platform in ["1mg", "pharmeasy", "netmeds", "apollo", "flipkart"]:
            pval = pe.get(platform)
            if pval:
                platforms[platform] = {
                    "price": pval,
                    "url": f"https://www.{platform}.com/search/all?name={name}"
                }

    savings = round(mrp - ja_price, 2) if mrp and ja_price else None
    saving_pct = round((mrp - ja_price) / mrp * 100) if mrp and ja_price and mrp > 0 else None

    return {
        "medicine": name,
        "generic": generic,
        "mrp": mrp,
        "platforms": platforms,
        "jan_aushadhi_name": ja_name,
        "jan_aushadhi_price_approx_inr": ja_price,
        "max_saving_inr": savings,
        "saving_percent": saving_pct,
        "jan_aushadhi_note": "Visit janaushadhi.gov.in or call 1800-180-8080 to find nearest Jan Aushadhi store.",
        "disclaimer": "Prices are approximate and may vary by location and pharmacy. Verify actual prices at point of purchase."
    }
