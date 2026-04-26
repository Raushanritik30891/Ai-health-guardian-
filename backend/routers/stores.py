"""
Nearby Medical Stores Router
Pharmacies, Jan Aushadhi, hospitals, clinics with GPS support
"""
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import httpx
import math
import logging
import os

router = APIRouter()
logger = logging.getLogger(__name__)

GOOGLE_MAPS_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")

# Static fallback store data — used only when GPS + Google Places is unavailable
STORES: dict = {
    "Delhi": [
        {"name": "Jan Aushadhi Kendra — AIIMS Gate 2", "type": "jan_aushadhi", "address": "AIIMS, Ansari Nagar, New Delhi", "phone": "1800-180-8080", "hours": "8AM–8PM", "lat": 28.5672, "lng": 77.2100},
        {"name": "Fortis Hospital Pharmacy", "type": "pharmacy", "address": "Vasant Kunj, New Delhi", "phone": None, "hours": "24/7", "lat": 28.5355, "lng": 77.1580},
        {"name": "Apollo Pharmacy — Connaught Place", "type": "pharmacy", "address": "Connaught Place, New Delhi", "phone": None, "hours": "8AM–10PM", "lat": 28.6328, "lng": 77.2197},
    ],
    "Mumbai": [
        {"name": "Jan Aushadhi Store — Dharavi", "type": "jan_aushadhi", "address": "Dharavi, Mumbai", "phone": "1800-180-8080", "hours": "9AM–7PM", "lat": 19.0414, "lng": 72.8544},
        {"name": "Kokilaben Hospital Pharmacy", "type": "pharmacy", "address": "Andheri West, Mumbai", "phone": None, "hours": "24/7", "lat": 19.1222, "lng": 72.8371},
    ],
    "Bangalore": [
        {"name": "Jan Aushadhi — Rajajinagar", "type": "jan_aushadhi", "address": "Rajajinagar, Bengaluru", "phone": "1800-180-8080", "hours": "9AM–8PM", "lat": 12.9922, "lng": 77.5518},
        {"name": "Manipal Hospital Pharmacy", "type": "pharmacy", "address": "Old Airport Road, Bengaluru", "phone": None, "hours": "24/7", "lat": 12.9568, "lng": 77.6477},
    ],
}


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in km between two GPS coordinates."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.asin(math.sqrt(a))


async def search_google_places(query: str, lat: float, lon: float, store_type: str) -> List[dict]:
    """Search Google Places API for nearby stores."""
    if not GOOGLE_MAPS_KEY:
        return []

    try:
        type_map = {
            "pharmacy": "pharmacy",
            "jan_aushadhi": "pharmacy",
            "hospital": "hospital",
            "clinic": "doctor",
            "all": "pharmacy"
        }
        place_type = type_map.get(store_type, "pharmacy")

        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(
                "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
                params={
                    "location": f"{lat},{lon}",
                    "radius": 5000,
                    "type": place_type,
                    "keyword": query,
                    "key": GOOGLE_MAPS_KEY,
                },
            )
            data = response.json()
            places = []
            for r in data.get("results", [])[:15]:
                places.append({
                    "name": r.get("name"),
                    "type": store_type,
                    "address": r.get("vicinity"),
                    "phone": None,
                    "hours": "Open" if r.get("opening_hours", {}).get("open_now") else "Check hours",
                    "lat": r["geometry"]["location"]["lat"],
                    "lng": r["geometry"]["location"]["lng"],
                    "rating": r.get("rating"),
                    "distance_km": round(haversine_distance(lat, lon, r["geometry"]["location"]["lat"], r["geometry"]["location"]["lng"]), 1),
                    "source": "google_places",
                    "place_id": r.get("place_id"),
                    "maps_url": f"https://maps.google.com/?q={r.get('name')},{r.get('vicinity')}",
                })
            return sorted(places, key=lambda x: x.get("distance_km", 99))
    except Exception as e:
        logger.error(f"Google Places API error: {e}")
        return []


@router.get("/search")
async def search_stores(
    city: Optional[str] = Query(None, description="City name"),
    store_type: str = Query("pharmacy", description="pharmacy|jan_aushadhi|hospital|clinic"),
    lat: Optional[float] = Query(None, description="GPS latitude"),
    lon: Optional[float] = Query(None, description="GPS longitude"),
    radius_km: float = Query(5.0, description="Search radius in km"),
):
    """Search for nearby medical stores by city or GPS coordinates."""

    # Try GPS + Google Places first
    if lat and lon and GOOGLE_MAPS_KEY:
        keyword_map = {
            "pharmacy": "pharmacy medical store",
            "jan_aushadhi": "jan aushadhi generic medicine",
            "hospital": "hospital",
            "clinic": "medical clinic doctor",
            "all": "pharmacy clinic hospital"
        }
        google_results = await search_google_places(
            keyword_map.get(store_type, "pharmacy"),
            lat, lon, store_type
        )
        if google_results:
            return {
                "stores": google_results,
                "total": len(google_results),
                "source": "google_places_api",
                "search_center": {"lat": lat, "lon": lon},
                "radius_km": radius_km,
            }

    # Fallback to static database with GPS distance if available
    search_city = None
    if city:
        # Match city in database
        for db_city in STORES.keys():
            if city.lower() in db_city.lower() or db_city.lower() in city.lower():
                search_city = db_city
                break

    if not search_city:
        search_city = "Delhi"  # Default

    stores = STORES.get(search_city, [])

    # Filter by type
    if store_type != "all":
        filtered = [s for s in stores if s.get("type") == store_type]
        if not filtered and store_type == "pharmacy":
            # Also include jan_aushadhi as pharmacy alternative
            filtered = [s for s in stores if s.get("type") in ("pharmacy", "jan_aushadhi")]
        stores = filtered if filtered else stores

    # Calculate distances if GPS provided
    if lat and lon:
        for store in stores:
            if store.get("lat") and store.get("lng"):
                store["distance_km"] = round(haversine_distance(lat, lon, store["lat"], store["lng"]), 1)
            else:
                store["distance_km"] = None
        stores = sorted(stores, key=lambda x: x.get("distance_km") or 999)

    # Add maps URLs
    for store in stores:
        if not store.get("maps_url"):
            store["maps_url"] = f"https://maps.google.com/?q={store.get('address', store.get('name', ''))}"

    return {
        "stores": stores,
        "total": len(stores),
        "source": "static_database",
        "city": search_city,
        "store_type": store_type,
        "jan_aushadhi_note": "Jan Aushadhi stores offer 50–90% cheaper government-approved generics. Find more at janaushadhi.gov.in or call 1800-180-8080",
    }


@router.get("/emergency")
async def emergency_contacts():
    """Return emergency medical contacts for India."""
    return {
        "emergency_contacts": [
            {"name": "Emergency Ambulance", "number": "108", "available": "24/7 across India", "type": "emergency"},
            {"name": "AIIMS Delhi Emergency", "number": "011-26588500", "available": "24/7", "type": "hospital"},
            {"name": "Jan Aushadhi Helpline", "number": "1800-180-8080", "available": "9AM–6PM Mon–Sat", "type": "pharmacy"},
            {"name": "NPPA Drug Price Helpline", "number": "1800-111-255", "available": "9AM–5:30PM Mon–Fri", "type": "regulation"},
            {"name": "Poison Control — AIIMS", "number": "1800-116-117", "available": "24/7", "type": "emergency"},
            {"name": "NIMHANS Mental Health", "number": "080-46110007", "available": "24/7", "type": "mental_health"},
            {"name": "iCall Mental Health", "number": "9152987821", "available": "Mon–Sat 8AM–10PM", "type": "mental_health"},
            {"name": "Vandrevala Foundation", "number": "1860-2662-345", "available": "24/7", "type": "mental_health"},
        ],
        "jan_aushadhi": {
            "website": "https://janaushadhi.gov.in",
            "helpline": "1800-180-8080",
            "store_locator": "https://janaushadhi.gov.in/StoreLocator.aspx",
            "description": "Government initiative — 8000+ stores with generic medicines at 50-90% lower prices",
        },
        "useful_links": {
            "find_jan_aushadhi": "https://janaushadhi.gov.in/StoreLocator.aspx",
            "nppa_prices": "https://www.nppaindia.nic.in/drug-price-ceiling/",
            "drug_prices_1mg": "https://www.1mg.com",
            "pharmeasy": "https://pharmeasy.in",
            "netmeds": "https://www.netmeds.com",
        },
    }


@router.get("/jan-aushadhi/products")
async def jan_aushadhi_products():
    """Return Jan Aushadhi product categories and savings info."""
    return {
        "description": "Jan Aushadhi Yojana — PM Bhartiya Janaushadhi Pariyojana (PMBJP)",
        "total_products": "1700+ medicines + 285 surgical items",
        "stores_count": "8000+ stores across India",
        "savings_average": "50–90% less than branded equivalents",
        "website": "https://janaushadhi.gov.in",
        "product_list_download": "https://janaushadhi.gov.in/data/productlist",
        "categories": [
            {"name": "Cardiovascular", "examples": ["Amlodipine", "Atorvastatin", "Metoprolol", "Ramipril"]},
            {"name": "Anti-diabetic", "examples": ["Metformin", "Glimepiride", "Voglibose", "Sitagliptin"]},
            {"name": "Anti-infective", "examples": ["Amoxicillin", "Azithromycin", "Ciprofloxacin", "Metronidazole"]},
            {"name": "Analgesic/Antipyretic", "examples": ["Paracetamol", "Ibuprofen", "Diclofenac", "Nimesulide"]},
            {"name": "Gastrointestinal", "examples": ["Omeprazole", "Pantoprazole", "Domperidone", "ORS"]},
            {"name": "Respiratory", "examples": ["Cetirizine", "Montelukast", "Salbutamol", "Budesonide inhaler"]},
            {"name": "Nutritional", "examples": ["Vitamin C", "Zinc", "Iron + Folic Acid", "Calcium"]},
        ],
        "price_examples": [
            {"medicine": "Paracetamol 500mg (10 tabs)", "branded": "₹22 (Crocin)", "jan_aushadhi": "₹7", "saving": "68%"},
            {"medicine": "Metformin 500mg (10 tabs)", "branded": "₹48 (Glycomet)", "jan_aushadhi": "₹14", "saving": "71%"},
            {"medicine": "Omeprazole 20mg (10 tabs)", "branded": "₹45 (Omez)", "jan_aushadhi": "₹12", "saving": "73%"},
            {"medicine": "Cetirizine 10mg (10 tabs)", "branded": "₹32 (Zyrtec)", "jan_aushadhi": "₹8", "saving": "75%"},
            {"medicine": "Azithromycin 500mg (3 tabs)", "branded": "₹95 (Azee)", "jan_aushadhi": "₹25", "saving": "74%"},
        ],
    }
