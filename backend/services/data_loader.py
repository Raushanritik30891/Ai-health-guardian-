"""
data_loader.py — Central Dataset Loading Service
Dynamically loads all JSON datasets from /backend/data/
All services must import from here; no component reads JSON directly.
"""
import json
import logging
import os
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# ── Base path ───────────────────────────────────────────────────────────────
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")


def _load(filename: str) -> Any:
    """Load a JSON file from DATA_DIR. Returns empty dict/list on error."""
    path = os.path.join(DATA_DIR, filename)
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        logger.warning(f"[DataLoader] Dataset not found: {path}")
        return {}
    except json.JSONDecodeError as e:
        logger.error(f"[DataLoader] Malformed JSON in {filename}: {e}")
        return {}
    except Exception as e:
        logger.error(f"[DataLoader] Unexpected error loading {filename}: {e}")
        return {}


# ── Eager-loaded datasets (loaded once at import time) ──────────────────────
_medicines_raw       = _load("medicines.json")
_interactions_raw    = _load("interactions.json")
_contraindications_raw = _load("contraindications.json")
_allergies_raw       = _load("allergies.json")
_alternatives_raw    = _load("alternatives.json")
_prices_raw          = _load("prices.json")
_pregnancy_rules_raw = _load("pregnancy_rules.json")
_salt_mapping_raw    = _load("salt_mapping.json")
_not_for_sale_raw    = _load("not_for_sale_keywords.json")
_expiry_patterns_raw = _load("expiry_patterns.json")
_validation_rules_raw= _load("validation_rules.json")
_diseases_raw        = _load("diseases.json")
_profile_questions_raw = _load("profile_questions.json")
_dosage_timing_raw   = _load("medicine_timing_rules.json")
_dosage_limits_raw   = _load("dosage_rules.json")


# ── Public accessors ─────────────────────────────────────────────────────────

def get_medicines() -> List[Dict]:
    """All medicine records from medicines.json."""
    return _medicines_raw.get("medicines", [])


def get_interactions() -> List[Dict]:
    """All drug-drug interaction records from interactions.json."""
    return _interactions_raw.get("interactions", [])


def get_contraindications() -> List[Dict]:
    """All contraindication records from contraindications.json."""
    return _contraindications_raw.get("contraindications", [])


def get_allergies() -> List[Dict]:
    """All allergy records from allergies.json."""
    return _allergies_raw.get("allergies", [])


def get_alternatives() -> List[Dict]:
    """All alternatives records from alternatives.json."""
    return _alternatives_raw.get("alternatives", [])


def get_prices() -> Dict:
    """Price lookup dict from prices.json."""
    return _prices_raw


def get_pregnancy_rules() -> List[Dict]:
    """Pregnancy-specific medicine rules from pregnancy_rules.json."""
    return _pregnancy_rules_raw.get("pregnancy_rules", [])


def get_salt_mapping() -> List[Dict]:
    """Salt aliases for brand→generic resolution from salt_mapping.json."""
    return _salt_mapping_raw.get("salt_mapping", [])


def get_not_for_sale_keywords() -> List[str]:
    """Keywords indicating government/restricted supply from not_for_sale_keywords.json."""
    raw = _not_for_sale_raw.get("not_for_sale_keywords", [])
    # Accept either list of strings or list of dicts with 'keyword' key
    if raw and isinstance(raw[0], dict):
        return [k.get("keyword", "") for k in raw]
    return [str(k) for k in raw]


def get_expiry_patterns() -> List[str]:
    """Regex patterns for detecting expiry dates from expiry_patterns.json."""
    raw = _expiry_patterns_raw.get("expiry_patterns", [])
    if raw and isinstance(raw[0], dict):
        return [p.get("pattern", "") for p in raw]
    return [str(p) for p in raw]


def get_validation_rules() -> Dict:
    """Validation thresholds and rules from validation_rules.json."""
    return _validation_rules_raw


def get_diseases() -> List[Dict]:
    """Disease definitions from diseases.json."""
    return _diseases_raw.get("diseases", [])


def get_profile_questions() -> List[Dict]:
    """Profile onboarding questions from profile_questions.json."""
    return _profile_questions_raw.get("profile_questions", [])


def get_dosage_timing() -> List[Dict]:
    """Medicine spacing rules from medicine_timing_rules.json."""
    return _dosage_timing_raw if isinstance(_dosage_timing_raw, list) else []


def get_dosage_limits() -> List[Dict]:
    """Daily dosage limits from dosage_rules.json."""
    return _dosage_limits_raw if isinstance(_dosage_limits_raw, list) else []


# ── Convenience: salt alias map (lowercase → canonical generic name) ─────────
def build_salt_alias_map() -> Dict[str, str]:
    """
    Returns a mapping of all known aliases (brand names, Hindi names, misspellings)
    → canonical generic/salt name (lowercase).
    Used for fuzzy medicine name resolution.
    """
    alias_map: Dict[str, str] = {}
    for med in get_medicines():
        canonical = med.get("generic_name", "").lower()
        if not canonical:
            continue
        # Brand name
        if med.get("brand_name"):
            alias_map[med["brand_name"].lower()] = canonical
        # searchable_aliases
        for alias in med.get("searchable_aliases", []):
            alias_map[alias.lower()] = canonical
        # Hindi aliases
        for alias in med.get("language_aliases_hindi", []):
            alias_map[alias.lower()] = canonical
        # Salt itself
        if med.get("salt"):
            alias_map[med["salt"].lower()] = canonical

    # Also add entries from salt_mapping.json
    for entry in get_salt_mapping():
        target = entry.get("generic", "").lower() or entry.get("salt", "").lower()
        for alias in entry.get("aliases", []):
            alias_map[alias.lower()] = target

    return alias_map


# Build alias map at import time for O(1) lookups
ALIAS_MAP: Dict[str, str] = build_salt_alias_map()


def resolve_to_generic(name: str) -> Optional[str]:
    """
    Resolve any input (brand name, Hindi alias, misspelling, generic name)
    to the canonical generic name. Returns None if no match found.
    """
    key = name.lower().strip()
    # 1. Exact alias match
    if key in ALIAS_MAP:
        return ALIAS_MAP[key]
    # 2. Partial match — find any alias that contains the query (or vice versa)
    for alias, generic in ALIAS_MAP.items():
        if key in alias or alias in key:
            return generic
    return None
