"""
interactions.py — Drug Interaction Router
Backed by /backend/data/interactions.json via services/data_loader.py
No hardcoded data. Forward requests to analyze.py's shared logic.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from routers.analyze import (
    check_interaction,
    check_contraindications,
    check_allergies,
    find_medicine,
)
from services.data_loader import resolve_to_generic

router = APIRouter()


class SessionProfile(BaseModel):
    diseases: List[str] = []
    allergies: List[str] = []
    currentMedicines: List[str] = []

class IntRequest(BaseModel):
    medicines: List[str]
    profile: Optional[SessionProfile] = None

@router.post("/check")
async def check(req: IntRequest):
    """
    Check interactions between a list of medicines.
    Uses interactions.json dataset via data_loader.
    """
    profile = req.profile
    include_profile = profile is not None
    diseases = profile.diseases if profile else []
    allergies_list = profile.allergies if profile else []
    curr_meds = profile.currentMedicines if profile else []

    all_meds = list(req.medicines)
    if include_profile and curr_meds:
        all_meds = list(dict.fromkeys(all_meds + curr_meds))

    results = []
    for i in range(len(all_meds)):
        for j in range(i + 1, len(all_meds)):
            g1 = resolve_to_generic(all_meds[i]) or all_meds[i]
            g2 = resolve_to_generic(all_meds[j]) or all_meds[j]
            inter = check_interaction(g1, g2)
            if inter:
                results.append({
                    "pair": [all_meds[i], all_meds[j]],
                    "severity": inter.get("verdict", "caution"),
                    "effect": inter.get("reason", ""),
                    "management": inter.get("action", ""),
                    "source": inter.get("source", ""),
                    "confidence": inter.get("confidence", "MEDIUM"),
                })
            else:
                results.append({
                    "pair": [all_meds[i], all_meds[j]],
                    "severity": "safe",
                    "effect": "No significant interaction found in our clinical database.",
                    "management": "Monitor for unexpected effects. Consult pharmacist if uncertain.",
                    "source": "Local dataset (interactions.json)",
                    "confidence": "N/A",
                })

    # Profile-driven alerts
    profile_alerts = []
    if include_profile:
        for name in req.medicines:
            med = find_medicine(name)
            if not med:
                continue
            for contra in check_contraindications(med["genericName"], diseases):
                profile_alerts.append({
                    "msg": f"{med['brandName']}: {contra['reason']}",
                    "severity": contra["verdict"],
                })
            for allergy_hit in check_allergies(med, allergies_list):
                profile_alerts.append({
                    "msg": allergy_hit["reason"],
                    "severity": "dangerous",
                })

    has_danger = (
        any(r["severity"] == "dangerous" for r in results) or
        any(a["severity"] == "dangerous" for a in profile_alerts)
    )
    has_caution = (
        any(r["severity"] == "caution" for r in results) or
        any(a.get("severity") == "caution" for a in profile_alerts)
    )
    overall = "dangerous" if has_danger else "caution" if has_caution else "safe"

    return {
        "overall_safety": overall,
        "overall_emoji": "🚨" if has_danger else "⚠️" if has_caution else "✅",
        "overall_message": (
            "STOP — Dangerous combination detected. Consult your doctor immediately."
            if has_danger else
            "Caution — Some interactions to be aware of. Review with pharmacist."
            if has_caution else
            "No major interactions found. Always follow prescribed dosages."
        ),
        "interactions": results,
        "profile_alerts": profile_alerts,
        "disclaimer": (
            "This information is based on our clinical dataset (interactions.json) and is for "
            "educational purposes only. Always consult a licensed doctor or pharmacist before "
            "combining medicines."
        ),
    }
