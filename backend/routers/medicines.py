"""
medicines.py — Medicine Info & Search Router
Backed by /backend/data/medicines.json via services/data_loader.py
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from services.data_loader import get_medicines, resolve_to_generic, ALIAS_MAP
from routers.analyze import (
    find_medicine,
    check_contraindications,
    check_allergies,
    check_pregnancy,
    get_alternatives_for,
)

router = APIRouter()


@router.get("/info/{name}")
async def get_medicine(
    name: str,
    age: Optional[int] = None,
    diseases: Optional[str] = None,
    allergies: Optional[str] = None,
    currentMedicines: Optional[str] = None,
    pregnant: Optional[bool] = False,
):
    med = find_medicine(name)
    if not med:
        raise HTTPException(
            status_code=404,
            detail=f"Medicine '{name}' not found. Try the generic name, brand name, or Hindi alias."
        )

    d = [x.strip() for x in diseases.split(",") if x.strip()] if diseases else []
    a = [x.strip() for x in allergies.split(",") if x.strip()] if allergies else []

    # Personalized risk checks
    personalized_risks = []
    for contra in check_contraindications(med["genericName"], d):
        personalized_risks.append({
            "severity": "dangerous" if contra["verdict"] == "dangerous" else "caution",
            "msg": contra["reason"],
            "source": contra.get("source", ""),
        })
    for allergy_hit in check_allergies(med, a):
        personalized_risks.append({
            "severity": "dangerous",
            "msg": allergy_hit["reason"],
            "crossReactivity": allergy_hit.get("crossReactivity", ""),
        })
    if pregnant:
        pw = check_pregnancy(med, True)
        if pw:
            personalized_risks.append({
                "severity": pw["verdict"],
                "msg": pw["reason"],
                "action": pw.get("action", ""),
            })

    # Alternatives
    alternatives = get_alternatives_for(med["genericName"])

    return {
        "medicine": med,
        "personalized_risks": personalized_risks,
        "alternatives": alternatives,
        "disclaimer": (
            "Information sourced from DailyMed, openFDA, and official Indian drug labeling. "
            "Always consult a licensed doctor or pharmacist."
        ),
    }


@router.get("/search")
async def search(q: str = Query(..., min_length=2)):
    """Full-text medicine search across brand name, generic, salt, Hindi aliases."""
    q_lower = q.lower().strip()
    results = []
    seen_generics = set()

    for med in get_medicines():
        brand = med.get("brand_name", "").lower()
        generic = med.get("generic_name", "").lower()
        aliases = [a.lower() for a in med.get("searchable_aliases", [])]
        hindi = [h.lower() for h in med.get("language_aliases_hindi", [])]

        score = 0
        if q_lower == generic:           score = 100
        elif q_lower == brand:           score = 95
        elif q_lower in generic:         score = 85
        elif q_lower in brand:           score = 80
        elif any(q_lower in a for a in aliases): score = 70
        elif any(q_lower in h for h in hindi):   score = 65
        elif generic in q_lower or brand in q_lower: score = 60

        if score > 0 and generic not in seen_generics:
            seen_generics.add(generic)
            results.append({
                "brandName": med.get("brand_name", ""),
                "genericName": med.get("generic_name", ""),
                "salt": med.get("salt", ""),
                "strength": med.get("strength", ""),
                "category": med.get("category", ""),
                "otc": med.get("otc", False),
                "prescriptionRequired": med.get("prescription_required", True),
                "score": score,
            })

    results.sort(key=lambda x: x["score"], reverse=True)
    return {"results": results[:15]}
