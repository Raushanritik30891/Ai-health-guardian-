"""
remedies.py — Home Remedies Router (graceful stub)
The REMEDIES_DB was previously hardcoded in datasets/medical_data.py (now removed).
This router returns a safe, educational fallback until a remedies.json dataset is added to /data.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Minimal built-in remedies (safe basic data, not condition-specific treatment advice) ──
BASIC_REMEDIES = {
    "fever": [
        {"name": "Paracetamol (Crocin/Dolo 650)", "type": "OTC Medicine", "dose": "500-650mg every 6 hrs", "note": "Most effective and safe for fever."},
        {"name": "Lukewarm water sponging", "type": "Home Remedy", "note": "Apply lukewarm (NOT cold) wet cloth to forehead and armpits."},
        {"name": "Hydration", "type": "Supportive Care", "note": "Drink plenty of water, ORS, coconut water."},
    ],
    "cold": [
        {"name": "Steam inhalation", "type": "Home Remedy", "note": "Inhale steam 2-3x daily to relieve congestion."},
        {"name": "Honey + Ginger tea", "type": "Ayurvedic", "note": "Soothe throat and reduce congestion naturally."},
        {"name": "Saline nasal drops", "type": "OTC", "note": "Safe for all ages, relieves nasal congestion."},
    ],
    "headache": [
        {"name": "Rest in a dark, quiet room", "type": "Home Remedy"},
        {"name": "Paracetamol 500mg", "type": "OTC Medicine", "note": "Safe for tension headaches."},
        {"name": "Cold compress", "type": "Home Remedy", "note": "Apply to forehead for 10-15 minutes."},
    ],
    "cough": [
        {"name": "Honey + warm water", "type": "Ayurvedic", "note": "1 tsp honey in warm water, 3x daily."},
        {"name": "Steam inhalation", "type": "Home Remedy", "note": "Helps loosen mucus."},
        {"name": "Tulsi tea", "type": "Ayurvedic", "note": "Traditional Indian remedy for cough."},
    ],
    "acidity": [
        {"name": "Cold milk / buttermilk", "type": "Home Remedy", "note": "Neutralizes stomach acid."},
        {"name": "Antacid (Gelusil / Digene)", "type": "OTC Medicine", "note": "Quick relief from acidity."},
        {"name": "Avoid spicy/oily food", "type": "Lifestyle", "note": "Dietary modification is key."},
    ],
    "diarrhea": [
        {"name": "ORS (Oral Rehydration Solution)", "type": "Essential", "note": "Prevents dehydration. Available at all chemists."},
        {"name": "BRAT diet", "type": "Dietary", "note": "Bananas, Rice, Applesauce, Toast — easy to digest."},
        {"name": "Avoid dairy and spicy food", "type": "Lifestyle"},
    ],
}


class RemedyRequest(BaseModel):
    symptoms: List[str]
    prefer_ayurvedic: bool = False


@router.post("/suggest")
async def suggest(req: RemedyRequest):
    all_remedies = []
    found = []

    for sym in req.symptoms:
        key = sym.lower().strip().replace(" ", "_")
        # Try exact match, then partial
        data = BASIC_REMEDIES.get(key)
        if not data:
            for k, v in BASIC_REMEDIES.items():
                if k in sym.lower() or sym.lower() in k:
                    data = v
                    key = k
                    break
        if data:
            found.append(sym)
            for r in data:
                rr = dict(r)
                rr["for_symptom"] = sym
                rr["ayurvedic"] = r.get("type", "").lower() in ("ayurvedic", "home remedy")
                all_remedies.append(rr)

    if not found:
        raise HTTPException(
            status_code=404,
            detail="No remedies found. Supported symptoms: Fever, Cold, Headache, Cough, Acidity, Diarrhea."
        )

    if req.prefer_ayurvedic:
        all_remedies.sort(key=lambda x: (0 if x.get("ayurvedic") else 1, x.get("name", "")))

    return {
        "symptoms_addressed": found,
        "remedies": all_remedies,
        "total": len(all_remedies),
        "safety_note": (
            "These are general supportive measures only. "
            "Always consult a doctor if symptoms are severe or persist beyond 3 days."
        ),
        "emergency_note": "🚨 Severe symptoms, difficulty breathing, chest pain: Call 108 IMMEDIATELY.",
    }


@router.get("/list")
async def list_remedies():
    return {
        "available_symptoms": list(BASIC_REMEDIES.keys()),
        "total": len(BASIC_REMEDIES),
        "note": "Full remedies dataset coming soon. Add remedies.json to /backend/data/ to expand."
    }
