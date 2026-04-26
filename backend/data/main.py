"""
AI Health Guardian — FastAPI Rule Engine Integration
=====================================================
This module shows how all 14 JSON data files connect inside a Python FastAPI backend.

FILE DEPENDENCY MAP:
=====================
    medicines.json          ←——— core lookup (medicine name → full record)
         |
    salt_mapping.json       ←——— brand → generic → alternatives mapping
         |
    interactions.json       ←——— drug-drug safety check (uses salt/generic names)
    contraindications.json  ←——— drug-disease safety check
    allergies.json          ←——— drug-allergy safety check
    pregnancy_rules.json    ←——— pregnancy-specific rules
         |
    alternatives.json       ←——— cheaper/generic options
    prices.json             ←——— price comparison
         |
    validation_rules.json   ←——— orchestration rules (priority-ordered)
    profile_questions.json  ←——— user profile schema
         |
    diseases.json           ←——— normalizes user-reported conditions
    not_for_sale_keywords.json  ← OCR post-processing
    expiry_patterns.json    ←——— OCR expiry date parsing
    sources.json            ←——— audit trail
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import json
import re
from pathlib import Path
from datetime import datetime

app = FastAPI(title="AI Health Guardian API", version="1.0.0")

# ─────────────────────────────────────────────
# 1. DATA LOADING
# ─────────────────────────────────────────────
DATA_DIR = Path("data")

def load_json(filename: str) -> dict | list:
    with open(DATA_DIR / filename, "r", encoding="utf-8") as f:
        return json.load(f)

# Load all datasets at startup
medicines_db         = {m["id"]: m for m in load_json("medicines.json")["medicines"]}
salt_map             = {s["normalized_name"]: s for s in load_json("salt_mapping.json")["salt_mappings"]}
interactions_db      = load_json("interactions.json")["interactions"]
contraindications_db = load_json("contraindications.json")["contraindications"]
allergies_db         = load_json("allergies.json")["allergies"]
pregnancy_db         = {r["medicine"]: r for r in load_json("pregnancy_rules.json")["pregnancy_rules"]}
alternatives_db      = {a["brand_name"]: a for a in load_json("alternatives.json")["alternatives"]}
prices_db            = load_json("prices.json")["prices"]
diseases_db          = load_json("diseases.json")["diseases"]
nfs_keywords         = load_json("not_for_sale_keywords.json")["not_for_sale_keywords"]
expiry_patterns      = load_json("expiry_patterns.json")["expiry_patterns"]
validation_rules     = sorted(
    load_json("validation_rules.json")["validation_rules"],
    key=lambda r: r["priority"]
)

# ─────────────────────────────────────────────
# 2. PYDANTIC MODELS
# ─────────────────────────────────────────────

class UserProfile(BaseModel):
    age: int
    sex: str
    pregnancy_status: Optional[str] = None
    breastfeeding: Optional[str] = None
    conditions: List[str] = []       # From diseases.json display_name values
    allergies: List[str] = []        # From allergies.json allergy_type values
    current_medicines: List[str] = [] # Generic/brand names

class ScanRequest(BaseModel):
    ocr_text: str
    ocr_confidence: float            # 0.0 to 1.0
    user_profile: Optional[UserProfile] = None

class SafetyResponse(BaseModel):
    medicine_found: Optional[dict]
    expiry_date: Optional[str]
    expiry_status: str               # "VALID", "EXPIRED", "NOT_FOUND"
    not_for_sale_flags: List[str]
    safety_alerts: List[dict]        # [{level, message, rule_id}]
    alternatives: Optional[dict]
    prices: List[dict]
    overall_safety_status: str       # "SAFE", "CAUTION", "DANGER", "BLOCKED"

# ─────────────────────────────────────────────
# 3. CORE LOOKUP FUNCTIONS
# ─────────────────────────────────────────────

def find_medicine(query: str) -> Optional[dict]:
    """
    Search medicines_db by brand_name, generic_name, salt, or searchable_aliases.
    Returns the first match. For fuzzy matching, integrate rapidfuzz library.
    """
    query_lower = query.lower().strip()
    for med in medicines_db.values():
        if query_lower in med.get("brand_name", "").lower():
            return med
        if query_lower in med.get("generic_name", "").lower():
            return med
        for alias in med.get("searchable_aliases", []):
            if query_lower in alias.lower():
                return med
    return None


def parse_expiry_date(ocr_text: str) -> Optional[str]:
    """
    Try each expiry_pattern regex in priority order.
    Returns ISO date string 'YYYY-MM-DD' or None.
    """
    month_map = {
        "JAN": 1, "FEB": 2, "MAR": 3, "APR": 4,
        "MAY": 5, "JUN": 6, "JUL": 7, "AUG": 8,
        "SEP": 9, "OCT": 10, "NOV": 11, "DEC": 12
    }
    text_upper = ocr_text.upper()
    for pattern in expiry_patterns:
        match = re.search(pattern["regex"], text_upper)
        if match:
            groups = match.groups()
            try:
                if len(groups) == 2:
                    # Determine if group 0 is month or year by size
                    g0, g1 = groups[0].strip(), groups[1].strip()
                    if g0 in month_map:
                        month = month_map[g0]
                        year = int(g1) if len(g1) == 4 else int("20" + g1)
                    elif g0.isdigit() and int(g0) > 12:  # year first (ISO format)
                        year = int(g0)
                        month = int(g1)
                    else:
                        month = int(g0)
                        year = int(g1) if len(g1) == 4 else int("20" + g1)
                    return f"{year:04d}-{month:02d}-01"
            except (ValueError, IndexError):
                continue
    return None


def check_not_for_sale(ocr_text: str) -> List[str]:
    """
    Scan OCR text for government supply / not-for-sale keywords.
    Returns list of matched canonical texts.
    """
    text_upper = ocr_text.upper()
    matches = []
    for kw in nfs_keywords:
        if re.search(kw["regex"], text_upper, re.IGNORECASE):
            matches.append(kw["canonical_text"])
    return matches


def get_interactions(medicine: dict, user_medicines: List[str]) -> List[dict]:
    """
    Check interactions.json for dangerous/caution pairs.
    Matches on generic_name, salt, or searchable_aliases.
    """
    alerts = []
    med_name = medicine.get("generic_name", "").lower()
    salt = medicine.get("salt", "").lower()
    for user_med_name in user_medicines:
        um_lower = user_med_name.lower()
        for interaction in interactions_db:
            a = interaction["medicine_a"].lower()
            b = interaction["medicine_b"].lower()
            if (med_name in a or salt in a) and um_lower in b:
                alerts.append(interaction)
            elif (med_name in b or salt in b) and um_lower in a:
                alerts.append(interaction)
    return alerts


def get_contraindications(medicine: dict, user_conditions: List[str]) -> List[dict]:
    """
    Check contraindications.json for drug-disease conflicts.
    """
    alerts = []
    med_name = medicine.get("generic_name", "").lower()
    for ci in contraindications_db:
        if ci["medicine"].lower() in med_name or med_name in ci["medicine"].lower():
            for condition in user_conditions:
                if condition.lower() in ci["condition"].lower():
                    alerts.append(ci)
    return alerts


def get_allergy_conflicts(medicine: dict, user_allergies: List[str]) -> List[dict]:
    """
    Check allergies.json for allergy contraindications.
    """
    conflicts = []
    med_name = medicine.get("generic_name", "").lower()
    salt = medicine.get("salt", "").lower()
    for alg in allergies_db:
        alg_med = alg["medicine"].lower()
        if med_name in alg_med or salt in alg_med:
            for user_allergy in user_allergies:
                if user_allergy.lower() in alg["allergy_type"].lower():
                    conflicts.append(alg)
    return conflicts


def check_pregnancy(medicine: dict, profile: UserProfile) -> Optional[dict]:
    """
    If user is pregnant, check pregnancy_rules.json.
    """
    if profile.pregnancy_status != "Yes":
        return None
    med_name = medicine.get("generic_name", "")
    for rule_med, rule in pregnancy_db.items():
        if med_name.lower() in rule_med.lower():
            return rule
    return None

# ─────────────────────────────────────────────
# 4. MAIN SAFETY CHECK ENDPOINT
# ─────────────────────────────────────────────

@app.post("/api/v1/scan", response_model=SafetyResponse)
async def scan_medicine(request: ScanRequest):
    """
    Main endpoint: accepts OCR text from medicine strip, applies all safety rules.
    """
    safety_alerts = []
    overall_status = "SAFE"

    # ── RULE VR001: OCR confidence check
    if request.ocr_confidence < 0.70:
        raise HTTPException(
            status_code=422,
            detail="OCR confidence too low. Please retake photo in better lighting."
        )

    # ── RULE VR013: Not-for-sale detection
    nfs_flags = check_not_for_sale(request.ocr_text)

    # ── Expiry date parsing
    expiry_date_str = parse_expiry_date(request.ocr_text)
    expiry_status = "NOT_FOUND"
    if expiry_date_str:
        expiry_dt = datetime.strptime(expiry_date_str, "%Y-%m-%d")
        if expiry_dt < datetime.now():
            expiry_status = "EXPIRED"
            safety_alerts.append({
                "level": "DANGER",
                "message": "This medicine appears to be EXPIRED. Do not use.",
                "rule_id": "VR003"
            })
            overall_status = "BLOCKED"
        else:
            expiry_status = "VALID"

    # ── Medicine lookup
    medicine = find_medicine(request.ocr_text)
    if not medicine:
        safety_alerts.append({
            "level": "INFO",
            "message": "Medicine not found in database. Please enter the generic name or consult a pharmacist.",
            "rule_id": "VR004"
        })
        return SafetyResponse(
            medicine_found=None,
            expiry_date=expiry_date_str,
            expiry_status=expiry_status,
            not_for_sale_flags=nfs_flags,
            safety_alerts=safety_alerts,
            alternatives=None,
            prices=[],
            overall_safety_status="UNKNOWN"
        )

    # ── Prescription reminder
    if medicine.get("prescription_required"):
        safety_alerts.append({
            "level": "INFO",
            "message": "This is a prescription medicine. Use only under medical supervision.",
            "rule_id": "VR015"
        })

    # ── Profile-based safety checks
    if request.user_profile:
        profile = request.user_profile

        # Interaction checks (VR006, VR007)
        interactions_found = get_interactions(medicine, profile.current_medicines)
        for interaction in interactions_found:
            level = "DANGER" if interaction["severity"] == "dangerous" else "CAUTION"
            conf_note = " (Uncertain — please verify)" if interaction["confidence_level"] == "MEDIUM" else ""
            safety_alerts.append({
                "level": level,
                "message": f"{level}: Possible interaction with {interaction['medicine_b']}. {interaction['clinical_reason']}{conf_note}",
                "recommended_action": interaction["recommended_action"],
                "rule_id": "VR006" if level == "DANGER" else "VR007",
                "source": interaction["source_name"]
            })
            if level == "DANGER":
                overall_status = "BLOCKED"
            elif overall_status == "SAFE":
                overall_status = "CAUTION"

        # Contraindication checks (VR008, VR009)
        ci_found = get_contraindications(medicine, profile.conditions)
        for ci in ci_found:
            level = "DANGER" if "ABSOLUTE" in ci["severity"] else "CAUTION"
            safety_alerts.append({
                "level": level,
                "message": f"WARNING: This medicine is not recommended for people with {ci['condition']}. {ci['reason']}",
                "rule_id": "VR008" if level == "DANGER" else "VR009",
                "source": ci["source_name"]
            })
            if level == "DANGER":
                overall_status = "BLOCKED"
            elif overall_status == "SAFE":
                overall_status = "CAUTION"

        # Allergy checks (VR012)
        allergy_conflicts = get_allergy_conflicts(medicine, profile.allergies)
        for conflict in allergy_conflicts:
            safety_alerts.append({
                "level": "DANGER",
                "message": f"ALLERGY ALERT: You have a documented {conflict['allergy_type']}. This medicine should NOT be taken.",
                "rule_id": "VR012",
                "source": conflict["source_name"]
            })
            overall_status = "BLOCKED"

        # Pregnancy checks (VR010, VR011)
        preg_rule = check_pregnancy(medicine, profile)
        if preg_rule:
            if "CONTRAINDICATED" in preg_rule["risk_level"]:
                safety_alerts.append({
                    "level": "DANGER",
                    "message": f"This medicine is NOT safe during pregnancy. {preg_rule['reason']}",
                    "rule_id": "VR010",
                    "source": preg_rule["source_name"]
                })
                overall_status = "BLOCKED"
            elif "CAUTION" in preg_rule["risk_level"]:
                safety_alerts.append({
                    "level": "CAUTION",
                    "message": f"Pregnancy caution: {preg_rule['reason']}",
                    "rule_id": "VR011",
                    "source": preg_rule["source_name"]
                })
                if overall_status == "SAFE":
                    overall_status = "CAUTION"

    # ── Alternatives (VR016)
    alt = alternatives_db.get(medicine.get("brand_name"))

    # ── Price lookup
    med_prices = [
        p for p in prices_db
        if medicine.get("brand_name", "").lower() in p["medicine"].lower()
    ]

    return SafetyResponse(
        medicine_found=medicine,
        expiry_date=expiry_date_str,
        expiry_status=expiry_status,
        not_for_sale_flags=nfs_flags,
        safety_alerts=safety_alerts,
        alternatives=alt,
        prices=med_prices,
        overall_safety_status=overall_status
    )


@app.get("/api/v1/medicines/search")
async def search_medicines(q: str):
    """Quick medicine name search."""
    results = []
    q_lower = q.lower()
    for med in medicines_db.values():
        if q_lower in med["brand_name"].lower() or q_lower in med["generic_name"].lower():
            results.append({
                "id": med["id"],
                "brand_name": med["brand_name"],
                "generic_name": med["generic_name"],
                "strength": med["strength"]
            })
    return {"results": results[:10]}


@app.get("/api/v1/interactions/{medicine_name}")
async def get_medicine_interactions(medicine_name: str):
    """List all known interactions for a medicine."""
    med_lower = medicine_name.lower()
    results = [
        i for i in interactions_db
        if med_lower in i["medicine_a"].lower() or med_lower in i["medicine_b"].lower()
    ]
    return {"medicine": medicine_name, "interactions": results}


@app.get("/api/v1/alternatives/{brand_name}")
async def get_alternatives(brand_name: str):
    """Get cheaper alternatives and Jan Aushadhi equivalent."""
    alt = alternatives_db.get(brand_name)
    if not alt:
        raise HTTPException(status_code=404, detail="No alternatives found")
    return alt


# ─────────────────────────────────────────────
# 5. STARTUP
# ─────────────────────────────────────────────
# Run with:
# uvicorn main:app --host 0.0.0.0 --port 8000 --reload
#
# Install dependencies:
# pip install fastapi uvicorn pydantic
#
# Optional for fuzzy matching:
# pip install rapidfuzz
