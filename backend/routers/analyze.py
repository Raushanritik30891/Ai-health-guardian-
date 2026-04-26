"""
analyze.py — Core Medicine Safety Analysis Route
Data is loaded dynamically from /backend/data/ via services/data_loader.py.
No hardcoded medicine, interaction, or contraindication values.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import json
import re
import uuid
import logging

from services.data_loader import (
    get_medicines,
    get_interactions,
    get_contraindications,
    get_allergies,
    get_alternatives,
    get_pregnancy_rules,
    get_not_for_sale_keywords,
    get_expiry_patterns,
    get_validation_rules,
    get_prices,
    get_dosage_timing,
    get_dosage_limits,
    resolve_to_generic,
    ALIAS_MAP,
)

logger = logging.getLogger(__name__)
router = APIRouter()


# ─── Pydantic Models ────────────────────────────────────────────────────────

class OCRData(BaseModel):
    brandName: Optional[str] = None
    genericName: Optional[str] = None
    expiryDate: Optional[str] = None
    isExpired: bool = False
    notForSaleDetected: bool = False
    confidence: float = 1.0


class SessionProfile(BaseModel):
    age: Optional[int] = None
    isPregnant: bool = False
    diseases: List[str] = []
    allergies: List[str] = []
    currentMedicines: List[str] = []


class DoseInfo(BaseModel):
    medicine: str
    time: str  # e.g., "08:00"
    dose_mg: float = 0.0

class AnalyzeRequest(BaseModel):
    medicines: List[str]
    profile: Optional[SessionProfile] = None
    ocrData: Optional[OCRData] = None
    schedule: List[DoseInfo] = []  # For timeline and dosage check


class MedicineSearchRequest(BaseModel):
    query: str


# ─── Medicine Lookup ────────────────────────────────────────────────────────

def find_medicine(name: str) -> Optional[Dict]:
    """
    Resolve a medicine name (brand / generic / Hindi alias / partial) to a record
    from medicines.json. Returns a normalized dict for downstream use.
    """
    generic = resolve_to_generic(name)
    if not generic:
        return None

    medicines = get_medicines()
    # Try exact generic_name match first
    for med in medicines:
        if med.get("generic_name", "").lower() == generic:
            return _normalize_medicine(med)
    # Fall back to partial containment
    for med in medicines:
        gn = med.get("generic_name", "").lower()
        if generic in gn or gn in generic:
            return _normalize_medicine(med)
    return None


def _normalize_medicine(med: Dict) -> Dict:
    """Convert medicines.json record into the internal format expected by analyze logic."""
    return {
        "id": med.get("id", ""),
        "brandName": med.get("brand_name", ""),
        "genericName": med.get("generic_name", ""),
        "description": med.get("description", ""),
        "salt": med.get("salt", ""),
        "strength": med.get("strength", ""),
        "class": med.get("category", ""),
        "uses": med.get("uses", []),
        "sideEffects": med.get("side_effects", []),
        "contraindications": med.get("contraindications", []),
        "pregnancySafe": med.get("pregnancy_safe"),
        "kidneyRisk": med.get("kidney_risk", ""),
        "liverRisk": med.get("liver_risk", ""),
        "isOTC": med.get("otc", False),
        "prescriptionRequired": med.get("prescription_required", False),
        "sourceUrl": med.get("source_url", ""),
        "confidence_level": med.get("confidence_level", "MEDIUM"),
    }


# ─── Drug-Drug Interaction Lookup ────────────────────────────────────────────

def check_interaction(generic1: str, generic2: str) -> Optional[Dict]:
    """
    Check two generics against interactions.json. Returns match or None.
    Matching uses substring containment so aliases resolve correctly.
    """
    g1, g2 = generic1.lower().strip(), generic2.lower().strip()
    interactions = get_interactions()

    for rule in interactions:
        a = rule.get("medicine_a", "").lower()
        b = rule.get("medicine_b", "").lower()

        match_ab = (g1 in a or a in g1) and (g2 in b or b in g2)
        match_ba = (g1 in b or b in g1) and (g2 in a or a in g2)

        if match_ab or match_ba:
            return {
                "drug1": generic1,
                "drug2": generic2,
                "verdict": rule.get("severity", "caution"),           # "dangerous" | "caution" | "safe"
                "reason": rule.get("clinical_reason", ""),
                "action": rule.get("recommended_action", ""),
                "source": rule.get("source_name", ""),
                "confidence": rule.get("confidence_level", "MEDIUM"),
            }
    return None


# ─── Contraindication Check ──────────────────────────────────────────────────

def check_contraindications(generic: str, diseases: List[str]) -> List[Dict]:
    """
    Match a generic drug against user's disease list using contraindications.json.
    """
    results = []
    g = generic.lower().strip()
    d_lower = [d.lower().strip() for d in diseases]

    for rule in get_contraindications():
        med_name = rule.get("medicine", "").lower()
        condition = rule.get("condition", "").lower()
        severity = rule.get("severity", "").upper()

        # Match medicine
        if not (g in med_name or med_name in g):
            continue
        # Match condition to any user disease
        matched = any(
            cond in condition or condition in cond
            for cond in d_lower
        )
        if matched:
            is_dangerous = "ABSOLUTE" in severity or "CONTRAINDICATION" in severity
            results.append({
                "medicine": generic,
                "condition": rule.get("condition", ""),
                "severity": severity,
                "verdict": "dangerous" if is_dangerous else "caution",
                "reason": rule.get("reason", ""),
                "source": rule.get("source_name", ""),
            })
    return results


# ─── Allergy Check ────────────────────────────────────────────────────────────

def check_allergies(med_record: Dict, user_allergies: List[str]) -> List[Dict]:
    """
    Check a medicine record against the user's declared allergies using allergies.json.
    Matches by medicine name, generic name, and allergy_type keyword.
    """
    results = []
    if not user_allergies:
        return results

    brand = med_record.get("brandName", "").lower()
    generic = med_record.get("genericName", "").lower()
    drug_class = med_record.get("class", "").lower()

    user_allergy_lower = [a.lower().strip() for a in user_allergies]

    for rule in get_allergies():
        med_name = rule.get("medicine", "").lower()
        allergy_type = rule.get("allergy_type", "").lower()
        reaction = rule.get("reaction", "")

        # Does this allergy rule apply to our medicine?
        med_matches = (
            brand in med_name or med_name in brand or
            generic in med_name or med_name in generic
        )
        if not med_matches:
            continue

        # Does the user have the matching allergy?
        for ua in user_allergy_lower:
            if ua in allergy_type or ua in med_name or ua in generic or ua in drug_class:
                results.append({
                    "medicine": med_record.get("brandName", generic),
                    "allergy": rule.get("allergy_type", ""),
                    "reaction": reaction,
                    "severity": rule.get("severity", ""),
                    "crossReactivity": rule.get("cross_reactivity_note", ""),
                    "verdict": "dangerous",
                    "reason": f"You have a {rule.get('allergy_type', ua)} allergy. "
                              f"This medicine ({med_record.get('brandName', generic)}) may cause: {reaction}.",
                })
                break  # one match per rule is enough
    return results


# ─── Pregnancy Check ─────────────────────────────────────────────────────────

def check_pregnancy(med_record: Dict, is_pregnant: bool) -> Optional[Dict]:
    """
    Check pregnancy safety using both the inline medicine flag and pregnancy_rules.json.
    """
    if not is_pregnant:
        return None

    generic = med_record.get("genericName", "").lower()
    brand = med_record.get("brandName", "")

    # 1. Quick check from inline flag
    pregnancy_safe = med_record.get("pregnancySafe")
    if pregnancy_safe is False:
        # 2. Try to find detailed rule from pregnancy_rules.json
        for rule in get_pregnancy_rules():
            med_name = rule.get("medicine", "").lower()
            if generic in med_name or med_name in generic:
                return {
                    "medicine": brand or generic,
                    "verdict": "dangerous",
                    "category": rule.get("fda_category", "X"),
                    "reason": rule.get("reason", f"{brand} is not recommended during pregnancy."),
                    "action": rule.get("recommended_action", "Consult your OB/GYN before taking this medicine."),
                }
        # Fallback reason when no rule is found but flag is False
        return {
            "medicine": brand or generic,
            "verdict": "caution",
            "category": "Unknown",
            "reason": f"{brand or generic} may not be safe during pregnancy. No detailed rule available.",
            "action": "Consult your doctor or OB/GYN before taking this medicine during pregnancy.",
        }
    return None


# ─── OCR Parsing ─────────────────────────────────────────────────────────────

def parse_ocr_result(text: str) -> Dict:
    """
    Parse raw OCR text using expiry_patterns.json and not_for_sale_keywords.json.
    Returns structured data.
    """
    import re as re_
    from datetime import datetime

    result = {
        "medicine": None,
        "expiry": None,
        "expired": False,
        "notForSale": False,
        "rawText": text,
    }

    if not text:
        return result

    # ── Expiry Detection ───────────────────────────────────────────────
    expiry_patterns = get_expiry_patterns()
    for pattern in expiry_patterns:
        try:
            matches = re_.findall(pattern, text, re_.IGNORECASE)
            if matches:
                raw_date = matches[0] if isinstance(matches[0], str) else matches[0][0]
                result["expiry"] = raw_date
                # Try to determine if expired
                for fmt in ["%m/%Y", "%m/%y", "%Y-%m", "%b %Y", "%B %Y", "%m-%Y"]:
                    try:
                        expiry_dt = datetime.strptime(raw_date, fmt)
                        result["expired"] = expiry_dt < datetime.now()
                        break
                    except ValueError:
                        continue
                break
        except re_.error as e:
            logger.warning(f"[OCR] Bad expiry pattern '{pattern}': {e}")

    # ── Not-for-sale Detection ─────────────────────────────────────────
    not_for_sale_kws = get_not_for_sale_keywords()
    text_lower = text.lower()
    for kw in not_for_sale_kws:
        if kw.lower() in text_lower:
            result["notForSale"] = True
            break

    # ── Medicine Name (simple heuristic — first capitalised word grouping) ─
    if not result["medicine"]:
        # Look for Rx-style heading
        name_match = re_.search(r'\b([A-Z][a-z]+(?:\s+[A-Z0-9][a-z0-9]*){0,3})\b', text)
        if name_match:
            result["medicine"] = name_match.group(0)

    return result


# ─── Alternatives Lookup ─────────────────────────────────────────────────────

def get_alternatives_for(generic: str) -> List[Dict]:
    """
    Find same-salt alternatives and Jan Aushadhi equivalent from alternatives.json.
    Returns a list of alternative brand objects (frontend-compatible field names).
    """
    g = generic.lower().strip()
    for entry in get_alternatives():
        salt = entry.get("salt", "").lower()
        brand = entry.get("brand_name", "").lower()
        if g in salt or salt in g or g in brand or brand in g:
            salt_label = entry.get("salt", "")
            ja_price = entry.get("jan_aushadhi_price_approx_inr")

            alts = []
            # Prepend Jan Aushadhi first — cheapest option
            ja = entry.get("jan_aushadhi_equivalent")
            if ja:
                alts.append({
                    "brandName": ja,
                    "genericName": salt_label,
                    "manufacturer": "Jan Aushadhi (PMBJP)",
                    "salt": salt_label,
                    "priceINR": ja_price,
                    "savingsINR": None,  # will be set per-brand below
                    "janAushadhi": True,
                    "where": "Jan Aushadhi Kendra — janaushadhi.gov.in",
                })

            for a in entry.get("alternatives", []):
                # Lookup price from prices.json
                branded_price = _lookup_price(salt_label, a.get("brand", ""))
                savings = round(branded_price - ja_price, 2) if branded_price and ja_price else None
                alts.append({
                    "brandName": a.get("brand", ""),
                    "genericName": salt_label,
                    "manufacturer": a.get("manufacturer", ""),
                    "salt": salt_label,
                    "priceINR": branded_price,
                    "savingsINR": savings,
                    "janAushadhi": False,
                })
            return alts
    return []


def _lookup_price(salt_label: str, brand: str) -> Optional[float]:
    """Find price from prices.json by matching salt or brand name."""
    salt_l = salt_label.lower()
    brand_l = brand.lower()
    prices = get_prices().get("prices", [])
    # Try brand match first
    for p in prices:
        if brand_l in p.get("brand", "").lower() or p.get("brand", "").lower() in brand_l:
            return p.get("price_inr")
    # Try salt/medicine match
    for p in prices:
        med = p.get("medicine", "").lower()
        if salt_l in med or any(word in med for word in salt_l.split()[:2]):
            return p.get("price_inr")
    return None


def get_prices_for(generic: str) -> List[Dict]:
    """Return all price entries from prices.json matching a medicine."""
    g = generic.lower().strip()
    prices = get_prices().get("prices", [])
    matched = []
    for p in prices:
        med = p.get("medicine", "").lower()
        brand = p.get("brand", "").lower()
        if g in med or g in brand or any(word in med for word in g.split()[:2]):
            matched.append({
                "brand": p.get("brand", ""),
                "platform": p.get("platform", ""),
                "priceINR": p.get("price_inr"),
                "unit": p.get("unit", ""),
                "isJanAushadhi": "pmbjp" in p.get("platform", "").lower() or "jan aushadhi" in p.get("brand", "").lower(),
                "sourceUrl": p.get("source_url", ""),
            })
    return matched


# ─── Risk Score Engine ────────────────────────────────────────────────────────

def calculate_risk_score(
    interactions: List[Dict],
    contra_violations: List[Dict],
    allergy_warnings: List[Dict],
    pregnancy_warnings: List[Dict],
    timeline_violations: List[Dict],
    dosage_violations: List[Dict],
    is_expired: bool,
) -> int:
    """
    Combine all subsystem outputs into one 0–100 risk score.
    Weightings based on validation_rules.json if present, else sensible defaults.
    """
    rules = get_validation_rules().get("risk_score_rules", {})
    score = 0

    dangerous_interaction_pts = rules.get("dangerous_interaction", 50)
    caution_interaction_pts   = rules.get("caution_interaction", 30)
    dangerous_contra_pts      = rules.get("dangerous_contraindication", 45)
    caution_contra_pts        = rules.get("caution_contraindication", 25)
    allergy_pts               = rules.get("allergy_match", 60)
    pregnancy_dangerous_pts   = rules.get("pregnancy_dangerous", 40)
    pregnancy_caution_pts     = rules.get("pregnancy_caution", 25)
    expired_pts               = rules.get("expired_medicine", 100)

    for inter in interactions:
        score += dangerous_interaction_pts if inter.get("verdict") == "dangerous" else caution_interaction_pts

    for contra in contra_violations:
        score += dangerous_contra_pts if contra.get("verdict") == "dangerous" else caution_contra_pts

    if allergy_warnings:
        score += allergy_pts * min(len(allergy_warnings), 2)

    for preg in pregnancy_warnings:
        score += pregnancy_dangerous_pts if preg.get("verdict") == "dangerous" else pregnancy_caution_pts

    # Impact of Timeline & Dosage (NEW)
    if timeline_violations:
        score += 35 * min(len(timeline_violations), 2)
    if dosage_violations:
        score += 55 * min(len(dosage_violations), 1)

    if is_expired:
        score = max(score, expired_pts)

    return min(score, 100)


# ─── Gemini Explanation ───────────────────────────────────────────────────────

def get_gemini_explanation(
    verdict: str,
    risk_score: int,
    medicines: List[str],
    interactions: List[Dict],
    profile: Optional[SessionProfile],
) -> Dict[str, str]:
    """Call Gemini to generate a short bilingual explanation. Falls back gracefully."""
    try:
        import google.generativeai as genai
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("No GEMINI_API_KEY set")

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")

        interaction_summary = "; ".join([
            f"{i['drug1']}+{i['drug2']}: {i.get('reason','')}"
            for i in interactions
        ]) if interactions else "None"

        profile_parts = []
        if profile:
            if profile.age:             profile_parts.append(f"age {profile.age}")
            if profile.diseases:        profile_parts.append(f"conditions: {', '.join(profile.diseases)}")
            if profile.allergies:       profile_parts.append(f"allergies: {', '.join(profile.allergies)}")
            if profile.isPregnant:      profile_parts.append("pregnant")
        profile_summary = "; ".join(profile_parts) or "No profile (general check)"

        prompt = (
            f"You are a medicine safety assistant for India. The safety system has determined:\n"
            f"- Verdict: {verdict}\n- Risk Score: {risk_score}/100\n"
            f"- Medicines: {', '.join(medicines)}\n"
            f"- Interactions: {interaction_summary}\n"
            f"- Patient: {profile_summary}\n\n"
            "DO NOT override the verdict. Explain it simply in 2-3 plain sentences for a general Indian audience.\n"
            "Return ONLY raw JSON (no markdown): "
            '{"explanation": "English text", "explanationHindi": "Hindi text in Devanagari"}'
        )

        response = model.generate_content(prompt)
        text = re.sub(r"```json?\s*|```", "", response.text.strip())
        return json.loads(text)

    except Exception as e:
        logger.warning(f"[Gemini] Explanation fallback: {e}")
        if verdict == "dangerous":
            return {
                "explanation": f"This medicine combination carries serious risks (score {risk_score}/100). Do NOT take together without a doctor's advice.",
                "explanationHindi": f"इन दवाओं का एक साथ उपयोग खतरनाक हो सकता है (स्कोर {risk_score}/100)। बिना डॉक्टर की सलाह के न लें।",
            }
        if verdict == "caution":
            return {
                "explanation": f"Use this medicine with caution (score {risk_score}/100). Monitor for side effects and consult a doctor.",
                "explanationHindi": f"इस दवा को सावधानी से लें (स्कोर {risk_score}/100)। दुष्प्रभावों पर नज़र रखें और डॉक्टर से मिलें।",
            }
        return {
            "explanation": f"This medicine appears generally safe (score {risk_score}/100). Follow the prescribed dosage instructions carefully.",
            "explanationHindi": f"यह दवा आमतौर पर सुरक्षित लगती है (स्कोर {risk_score}/100)। बताई गई खुराक के अनुसार लें।",
        }


def get_medicine_explanation(brand: str, generic: str, description: str, uses: List[str], side_effects: List[str]) -> Dict[str, str]:
    """Generate a plain-language explanation for a single medicine using Gemini."""
    try:
        import google.generativeai as genai
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("No key")
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        se_str   = ", ".join(side_effects[:3]) if side_effects else "consult leaflet"
        prompt = (
            f"Here is the verified medical description from the backend dataset for '{brand}' ({generic}):\n"
            f"\"{description}\"\n\n"
            f"Translate and explain this exact description to a general Indian patient in simple, easy-to-understand language. "
            f"CRITICAL: Do NOT change any facts, do NOT add any new medical information, just rewrite it simply.\n"
            f"Also mention common side effects: {se_str}.\n"
            f"Write exactly 2 short sentences in English and 2 short sentences in Hindi (Devanagari).\n"
            'Return ONLY raw JSON: {"en": "English text", "hi": "Hindi text in Devanagari"}'
        )
        response = model.generate_content(prompt)
        text = re.sub(r"```json?\s*|```", "", response.text.strip())
        return json.loads(text)
    except Exception as e:
        logger.warning(f"[Gemini] Medicine explanation fallback for {brand}: {e}")
        uses_str = ", ".join(uses[:2]) if uses else "general use"
        return {
            "en": f"{brand} ({generic}) is used for {uses_str}. Take exactly as prescribed by your doctor.",
            "hi": f"{brand} ({generic}) का उपयोग {uses_str} के लिए किया जाता है। डॉक्टर के निर्देशानुसार लें।"
        }



# ─── Logic Helpers ──────────────────────────────────────────────────────────

def get_dosage_info(generic_name: str) -> Optional[Dict]:
    """Find dosage rules for a medicine from dosage_rules.json."""
    g = generic_name.lower().strip()
    # Strip parenthetical suffixes
    g_clean = re.sub(r'\(.*?\)', '', g).strip()
    for rule in get_dosage_limits():
        rule_gen = re.sub(r'\(.*?\)', '', rule.get("generic_name", "")).lower().strip()
        rule_words = [w for w in rule_gen.split() if len(w) > 3]
        if rule_gen in g_clean or g_clean in rule_gen or any(w in g_clean for w in rule_words):
            return {
                "usual_single_dose":  rule.get("usual_single_dose", ""),
                "max_daily_dose":     rule.get("max_daily_dose", ""),
                "frequency":          rule.get("frequency", ""),
                "special_risk_groups": rule.get("special_risk_groups", []),
                "source":             rule.get("source_name", ""),
            }
    return None

def parse_val_str(s: str) -> float:
    """Extract first number from strings like '4000 mg/day' or '4 hours'."""
    if not s: return 0.0
    match = re.search(r'(\d+(?:\.\d+)?)', s)
    return float(match.group(1)) if match else 0.0

def calculate_confidence(matches: List[Dict], interactions: List[Dict]) -> Dict:
    """Calculate aggregate confidence as a percentage based on source quality."""
    scores = []
    sources = set()
    
    # Base confidence from medicine records
    for m in matches:
        level = m.get("confidence_level", "MEDIUM")
        scores.append(98 if level == "HIGH" else 75 if level == "MEDIUM" else 40)
        if m.get("source_name"): sources.add(m["source_name"])
    
    # Confidence from interactions
    for i in interactions:
        level = i.get("confidence", i.get("severity", "MEDIUM")).upper()
        scores.append(95 if level == "HIGH" else 70 if level == "MEDIUM" or level == "MODERATE" else 30)
        source_val = i.get("source") or i.get("source_name")
        if source_val: sources.add(source_val)
        
    avg = sum(scores)/len(scores) if scores else 50
    return {
        "percentage": round(avg),
        "level": "High" if avg >= 85 else "Medium" if avg >= 60 else "Low",
        "sources": list(sources)[:3]
    }

def check_dosage_safety(schedule: List[DoseInfo]) -> List[Dict]:
    """Check if cumulative daily doses exceed safety thresholds from dosage_rules.json."""
    if not schedule: return []
    
    # Build totals keyed by both generic name AND stripped brands
    totals = {}
    for d in schedule:
        # Try full resolve first
        generic = resolve_to_generic(d.medicine)
        if not generic:
            # Strip dosage suffix: 'Dolo 650' → 'dolo', 'Shelcal 500' → 'shelcal'
            base = re.sub(r'\s+\d+\s*(mg|mcg|ml|g|iu)?$', '', d.medicine, flags=re.IGNORECASE).strip().lower()
            generic = resolve_to_generic(base) or base
        totals[generic] = totals.get(generic, 0) + d.dose_mg
        # Also index by first word (brand prefix)
        first_word = generic.split()[0] if generic else generic
        if first_word != generic:
            totals[first_word] = totals.get(first_word, 0) + d.dose_mg

    logger.info(f"[Dosage] totals={totals}")

    warnings = []
    limits = get_dosage_limits()
    for l in limits:
        # Strip parentheses: 'Paracetamol (Acetaminophen)' → 'paracetamol'
        l_gen = re.sub(r'\(.*?\)', '', l["generic_name"]).lower().strip()
        # Also try individual words of the generic name
        l_words = l_gen.split()
        matched_key = None
        for key in totals:
            if key in l_gen or l_gen in key or any(w in key for w in l_words if len(w) > 4):
                matched_key = key
                break
        if matched_key:
            limit_mg = parse_val_str(l["max_daily_dose"])
            total_taken = totals[matched_key]
            logger.info(f"[Dosage] {l_gen}: taken={total_taken}mg limit={limit_mg}mg")
            if limit_mg > 0 and total_taken > limit_mg:
                warnings.append({
                    "generic": l["generic_name"],
                    "total": total_taken,
                    "limit": limit_mg,
                    "warning": l["warning_if_exceeded"],
                    "warning_hindi": l.get("warning_hindi", l["warning_if_exceeded"])
                })
    return warnings

def _resolve_med_name(name: str) -> str:
    """Resolve brand/dosage names to generic, stripping dosage suffixes."""
    # First try direct resolve
    g = resolve_to_generic(name)
    if g:
        return g
    # Strip numeric suffix: 'Dolo 650' → 'Dolo', 'Shelcal 500' → 'Shelcal'
    base = re.sub(r'\s+\d+\s*(mg|mcg|ml|g|iu|tab|cap)?$', '', name, flags=re.IGNORECASE).strip()
    g2 = resolve_to_generic(base)
    if g2:
        return g2
    return base.lower()


def check_timeline_gaps(schedule: List[DoseInfo]) -> List[Dict]:
    """Check if medicine spacing rules from medicine_timing_rules.json are violated."""
    if len(schedule) < 2: return []
    
    rules = get_dosage_timing()
    violations = []
    
    def to_min(t_str):
        try:
            h, m = map(int, t_str.split(':'))
            return h * 60 + m
        except: return 0
        
    sorted_s = sorted(schedule, key=lambda x: to_min(x.time))
    
    for i in range(len(sorted_s)):
        for j in range(i + 1, len(sorted_s)):
            # Resolve both to generic using improved resolver
            med1_raw = sorted_s[i].medicine
            med2_raw = sorted_s[j].medicine
            med1 = _resolve_med_name(med1_raw)
            med2 = _resolve_med_name(med2_raw)
            time1 = to_min(sorted_s[i].time)
            time2 = to_min(sorted_s[j].time)
            gap_hrs = (time2 - time1) / 60
            
            logger.info(f"[Timeline] {med1_raw}→{med1} vs {med2_raw}→{med2}, gap={gap_hrs}h")

            for r in rules:
                # Strip parenthetical brand names from rule fields
                ra = re.sub(r'\(.*?\)', '', r["medicine_a"]).lower().strip()
                rb = re.sub(r'\(.*?\)', '', r["medicine_b_or_food"]).lower().strip()
                # Also extract first meaningful word from each rule field
                ra_words = [w for w in ra.split() if len(w) > 3]
                rb_words = [w for w in rb.split() if len(w) > 3]

                m1_match_a = med1 in ra or ra in med1 or any(w in med1 for w in ra_words)
                m1_match_b = med1 in rb or rb in med1 or any(w in med1 for w in rb_words)
                m2_match_a = med2 in ra or ra in med2 or any(w in med2 for w in ra_words)
                m2_match_b = med2 in rb or rb in med2 or any(w in med2 for w in rb_words)
                
                rule_matches = (m1_match_a and m2_match_b) or (m1_match_b and m2_match_a)
                    
                if rule_matches:
                    req_gap_hrs = parse_val_str(r["minimum_gap"])
                    logger.info(f"[Timeline] RULE MATCH: {ra} ↔ {rb}, required={req_gap_hrs}h actual={gap_hrs}h")
                    if req_gap_hrs > 0 and gap_hrs < req_gap_hrs:
                        violations.append({
                            "pair": [med1_raw, med2_raw],
                            "actual_gap": round(gap_hrs, 1),
                            "required_gap": req_gap_hrs,
                            "reason": r["reason"],
                            "reason_hindi": r.get("reason_hindi", r["reason"]),
                            "recommendation": r["recommendation"],
                            "recommendation_hindi": r.get("recommendation_hindi", r["recommendation"]),
                            "severity": r.get("severity", "moderate")
                        })
    return violations

# ─── API Routes ──────────────────────────────────────────────────────────────

@router.post("")
async def analyze_medicines(req: AnalyzeRequest):
    if not req.medicines:
        raise HTTPException(
            status_code=400,
            detail={"code": "INVALID_INPUT", "message": "At least one medicine name is required."}
        )
    
    # Debug logging for development
    logger.info(f"[Analyze] medicines={req.medicines} profile={'YES' if req.profile else 'NO'} schedule_count={len(req.schedule)}")
    if req.schedule:
        for s in req.schedule:
            logger.info(f"  schedule: {s.medicine} @ {s.time} = {s.dose_mg}mg")

    try:
        # 1. Resolve and lookup medicines in DB
        found_medicines = []
        not_found = []
        for name in req.medicines:
            med = find_medicine(name)
            if med:
                found_medicines.append(med)
                logger.info(f"  found: {name} → {med.get('genericName','?')}")
            else:
                not_found.append(name)
                logger.warning(f"  NOT FOUND: {name}")
        
        # 2. Pairwise interaction check
        interactions = []
        generics = [m["genericName"] for m in found_medicines]
        for i in range(len(generics)):
            for j in range(i + 1, len(generics)):
                intersect = check_interaction(generics[i], generics[j])
                if intersect:
                    interactions.append({
                        "drug1": found_medicines[i]["brandName"],
                        "drug2": found_medicines[j]["brandName"],
                        "verdict": intersect["verdict"],
                        "reason": intersect["reason"],
                        "action": intersect.get("action", ""),
                        "confidence": intersect.get("confidence", "MEDIUM")
                    })
        
        # 3. Profile-based contraindications & allergies
        disease_warnings = []
        allergy_warnings = []
        pregnancy_warnings = []
        
        if req.profile:
            for med in found_medicines:
                # Contra
                contras = check_contraindications(med["genericName"], req.profile.diseases)
                for c in contras:
                    disease_warnings.append({"medicine": med["brandName"], "reason": c["reason"], "verdict": c["verdict"]})
                # Allergies
                al = check_allergies(med, req.profile.allergies)
                for hit in al:
                    allergy_warnings.append({"medicine": med["brandName"], "reason": hit["reason"]})
                # Pregnancy
                if req.profile.isPregnant:
                    pw = check_pregnancy(med, True)
                    if pw:
                        pregnancy_warnings.append({"medicine": med["brandName"], "reason": pw["reason"], "verdict": pw["verdict"]})

        # 4. Timeline & Dosage Safety
        timeline_violations = check_timeline_gaps(req.schedule)
        dosage_violations = check_dosage_safety(req.schedule)
        
        # 5. Risk Scoring & Confidence
        # Extract OCR data before scoring so we can pass is_expired
        is_expired = req.ocrData.isExpired if req.ocrData else False
        not_for_sale = req.ocrData.notForSaleDetected if req.ocrData else False
        expiry_warning = None
        if is_expired:
            expiry_warning = {"expiryDate": req.ocrData.expiryDate, "isExpired": True, "message": "This medicine has expired."}

        score = calculate_risk_score(
            interactions, 
            disease_warnings, 
            allergy_warnings, 
            pregnancy_warnings,
            timeline_violations,
            dosage_violations,
            is_expired
        )
        verdict = "dangerous" if score >= 71 else "caution" if score >= 31 else "safe"
        confidence = calculate_confidence(found_medicines, interactions)

        # 7. Alternatives & Pricing
        alternatives = []
        prices_info = {}
        if len(found_medicines) == 1:
            target = found_medicines[0]
            alternatives = get_alternatives_for(target["genericName"])
            prices_info = get_prices().get(target["genericName"], {})

        # 8. AI Summary (Gemini)
        explanation_data = get_gemini_explanation(verdict, score, req.medicines, interactions, req.profile if req.profile else None)

        # 9. Enrich each found medicine with LLM explanation + dosage info
        enriched_medicines = []
        for med in found_medicines:
            dosage_info = get_dosage_info(med.get("genericName", ""))
            med_explanation = get_medicine_explanation(
                med.get("brandName", ""),
                med.get("genericName", ""),
                med.get("description", ""),
                med.get("uses", []),
                med.get("sideEffects", [])
            )
            enriched_medicines.append({
                **med,
                "dosageInfo": dosage_info,
                "explanationEn": med_explanation.get("en", ""),
                "explanationHi": med_explanation.get("hi", "")
            })

        # Build smart next action based on verdict
        if verdict == "dangerous":
            next_action = "Do NOT take these medicines together. Consult a doctor or pharmacist immediately."
            next_action_hi = "इन दवाओं को एक साथ न लें। तुरंत डॉक्टर या फार्मासिस्ट से मिलें।"
        elif verdict == "caution":
            next_action = "Take with caution. Monitor for side effects and consult your doctor."
            next_action_hi = "सावधानी से लें। दुष्प्रभावों पर ध्यान दें और डॉक्टर से परामर्श करें।"
        else:
            next_action = "Generally safe. Always follow the prescribed dose. When in doubt, ask your pharmacist."
            next_action_hi = "आमतौर पर सुरक्षित है। हमेशा निर्धारित खुराक लें। संदेह होने पर फार्मासिस्ट से पूछें।"

        logger.info(f"[Analyze] profile check → diseases={req.profile.diseases if req.profile else None} allergies={req.profile.allergies if req.profile else None}")
        return {
            "success": True,
            "data": {
                "riskScore": score,
                "verdict": verdict,
                "confidence": confidence,
                "explanation": explanation_data.get("explanation") or next_action,
                "explanationHindi": explanation_data.get("explanationHindi") or next_action_hi,
                "medicines": req.medicines,
                "interactions": interactions,
                "diseaseWarnings": [w.get("reason", str(w)) if isinstance(w, dict) else str(w) for w in disease_warnings],
                "allergyWarnings": [w.get("reason", str(w)) if isinstance(w, dict) else str(w) for w in allergy_warnings],
                "pregnancyWarning": len(pregnancy_warnings) > 0,
                "pregnancyWarnings": [w.get("reason", str(w)) if isinstance(w, dict) else str(w) for w in pregnancy_warnings],
                "timelineViolations": timeline_violations,
                "dosageViolations": dosage_violations,
                "expiryWarning": expiry_warning,
                "notForSaleWarning": not_for_sale,
                "alternatives": alternatives,
                "prices": prices_info,
                "medicineDetails": enriched_medicines,
                "notFoundMedicines": not_found,
                "dataSource": "Verified Clinical Datasets v2.0",
                "nextAction": next_action,
                "nextActionHindi": next_action_hi,
                "isPersonalized": req.profile is not None,
                "schedule": [{"medicine": d.medicine, "time": d.time, "dose_mg": d.dose_mg} for d in req.schedule]
            }
        }
    except Exception as e:
        logger.error(f"Analysis Crash: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail={"message": f"Engine Error: {str(e)}", "code": "ANALYSIS_FAILURE"})


@router.get("/search")
async def search_medicines(q: str = ""):
    """
    Live medicine search backed by medicines.json + salt_mapping.json.
    Supports brand name, generic name, Hindi alias, partial match.
    """
    if not q or len(q.strip()) < 2:
        return {"data": [], "error": None}

    q_lower = q.lower().strip()
    medicines = get_medicines()
    results = []

    for med in medicines:
        brand = med.get("brand_name", "").lower()
        generic = med.get("generic_name", "").lower()
        aliases = [a.lower() for a in med.get("searchable_aliases", [])]
        hindi = [a.lower() for a in med.get("language_aliases_hindi", [])]

        if (q_lower in brand or q_lower in generic or
                any(q_lower in a for a in aliases) or
                any(q_lower in h for h in hindi) or
                brand in q_lower or generic in q_lower):
            results.append({
                "brandName": med.get("brand_name", ""),
                "genericName": med.get("generic_name", ""),
                "strength": med.get("strength", ""),
                "category": med.get("category", ""),
                "otc": med.get("otc", False),
                "prescriptionRequired": med.get("prescription_required", True),
            })

        if len(results) >= 10:
            break

    return {"data": results, "error": None}


@router.post("/interactions/check")
async def check_interactions(req: AnalyzeRequest):
    """
    Dedicated interaction checker endpoint — same logic as /api/analyze
    but returns only interaction results.
    Used directly by the Interactions.jsx page.
    """
    if len(req.medicines) < 2:
        raise HTTPException(
            status_code=400,
            detail={"code": "INVALID_INPUT",
                    "message": "At least 2 medicines required for interaction check.",
                    "messageHindi": "Interaction check ke liye kam se kam 2 dawaein chahiye."}
        )

    # Resolve generics
    resolved = []
    for name in req.medicines:
        generic = resolve_to_generic(name)
        resolved.append(generic or name)

    # Pairwise check
    interactions = []
    for i in range(len(resolved)):
        for j in range(i + 1, len(resolved)):
            result = check_interaction(resolved[i], resolved[j])
            if result:
                result["pair"] = [req.medicines[i], req.medicines[j]]
                result["effect"] = result.get("reason", "")
                result["management"] = result.get("action", "")
                result["severity"] = result.get("verdict", "safe")
                interactions.append(result)

    # Profile-based alerts
    profile_alerts = []
    if req.profile:
        for name in req.medicines:
            med = find_medicine(name)
            if not med:
                continue
            contras = check_contraindications(med["genericName"], req.profile.diseases or [])
            for c in contras:
                profile_alerts.append({"msg": c["reason"], "severity": c["verdict"]})
            allergy_hits = check_allergies(med, req.profile.allergies or [])
            for h in allergy_hits:
                profile_alerts.append({"msg": h["reason"], "severity": "dangerous"})

    # Overall
    has_dangerous = any(i.get("severity") == "dangerous" for i in interactions) or \
                    any(a.get("severity") == "dangerous" for a in profile_alerts)
    has_caution = any(i.get("severity") == "caution" for i in interactions)
    overall_safety = "dangerous" if has_dangerous else "caution" if has_caution else "safe"
    overall_emoji = {"dangerous": "🚨", "caution": "⚠️", "safe": "✅"}[overall_safety]

    return {
        "overall_safety": overall_safety,
        "overall_emoji": overall_emoji,
        "overall_message": (
            "Dangerous combination detected. Consult your doctor immediately."
            if overall_safety == "dangerous"
            else "Exercise caution. Monitor for side effects."
            if overall_safety == "caution"
            else "No major interactions detected."
        ),
        "interactions": interactions,
        "profile_alerts": profile_alerts,
        "disclaimer": (
            "This information is AI-assisted and for educational purposes only. "
            "Always consult a qualified doctor or pharmacist before combining medicines."
        ),
    }
