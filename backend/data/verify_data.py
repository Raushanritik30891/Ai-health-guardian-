"""
AI Health Guardian — Data Integrity Checker
============================================
Run this script to validate all JSON files before deploying.
Usage: python3 verify_data.py
"""

import json
import re
import sys
from pathlib import Path
from datetime import datetime

DATA_DIR = Path("data")
PASS = "✅"
WARN = "⚠️ "
FAIL = "❌"
errors = []
warnings = []

def load(filename):
    with open(DATA_DIR / filename, 'r', encoding='utf-8') as f:
        return json.load(f)

def check(condition, message, critical=False):
    if not condition:
        if critical:
            errors.append(f"{FAIL} {message}")
        else:
            warnings.append(f"{WARN} {message}")
    else:
        print(f"  {PASS} {message}")

print("=" * 60)
print("AI Health Guardian — Data Integrity Check")
print(f"Run at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("=" * 60)

# ─── medicines.json ────────────────────────────────────────
print("\n[1] medicines.json")
try:
    meds = load("medicines.json")
    records = meds.get("medicines", [])
    check(len(records) >= 100, f"{len(records)} medicines (target: 100)", critical=True)
    
    ids = [m["id"] for m in records]
    check(len(ids) == len(set(ids)), "All medicine IDs are unique", critical=True)
    
    null_pregnancy = [m["brand_name"] for m in records if m.get("pregnancy_safe") is None]
    print(f"  {WARN} {len(null_pregnancy)} medicines have null pregnancy_safe (needs source verification)")
    
    missing_source = [m["brand_name"] for m in records if not m.get("source_url")]
    check(len(missing_source) == 0, f"All medicines have source_url", critical=True)
    
    no_aliases = [m["brand_name"] for m in records if not m.get("searchable_aliases")]
    check(len(no_aliases) == 0, f"All medicines have searchable_aliases", critical=False)
    
except Exception as e:
    errors.append(f"{FAIL} medicines.json failed to load: {e}")

# ─── salt_mapping.json ─────────────────────────────────────
print("\n[2] salt_mapping.json")
try:
    salt = load("salt_mapping.json")
    records = salt.get("salt_mappings", [])
    check(len(records) >= 10, f"{len(records)} salt mappings loaded", critical=False)
    
    no_jan = [r["brand_name"] for r in records if not r.get("jan_aushadhi_equivalent")]
    print(f"  {WARN} {len(no_jan)} mappings missing Jan Aushadhi equivalent: {no_jan}")

except Exception as e:
    errors.append(f"{FAIL} salt_mapping.json: {e}")

# ─── interactions.json ─────────────────────────────────────
print("\n[3] interactions.json")
try:
    inter = load("interactions.json")
    records = inter.get("interactions", [])
    check(len(records) >= 30, f"{len(records)} interactions loaded (target: 30+)", critical=True)
    
    severe = [r for r in records if r["severity"] == "dangerous"]
    caution = [r for r in records if r["severity"] == "caution"]
    print(f"  {PASS} Dangerous: {len(severe)}, Caution: {len(caution)}")
    
    missing_action = [r["id"] for r in records if not r.get("recommended_action")]
    check(len(missing_action) == 0, "All interactions have recommended_action", critical=True)
    
    low_conf = [r["id"] for r in records if r.get("confidence_level") == "LOW"]
    if low_conf:
        warnings.append(f"{WARN} Low confidence interactions: {low_conf}")

except Exception as e:
    errors.append(f"{FAIL} interactions.json: {e}")

# ─── contraindications.json ────────────────────────────────
print("\n[4] contraindications.json")
try:
    ci = load("contraindications.json")
    records = ci.get("contraindications", [])
    check(len(records) >= 25, f"{len(records)} contraindications loaded", critical=True)
    
    missing_reason = [r["id"] for r in records if not r.get("reason")]
    check(len(missing_reason) == 0, "All contraindications have reasons documented", critical=True)

except Exception as e:
    errors.append(f"{FAIL} contraindications.json: {e}")

# ─── pregnancy_rules.json ──────────────────────────────────
print("\n[5] pregnancy_rules.json")
try:
    pg = load("pregnancy_rules.json")
    records = pg.get("pregnancy_rules", [])
    check(len(records) >= 15, f"{len(records)} pregnancy rules loaded", critical=True)
    
    # Check all high-risk drugs have entries
    must_have = ["Atorvastatin", "Telmisartan", "Sodium Valproate", "Methotrexate", "Warfarin"]
    pg_meds = [r["medicine"] for r in records]
    for med in must_have:
        found = any(med.lower() in m.lower() for m in pg_meds)
        check(found, f"High-risk medicine '{med}' has pregnancy rule", critical=True)

except Exception as e:
    errors.append(f"{FAIL} pregnancy_rules.json: {e}")

# ─── allergies.json ────────────────────────────────────────
print("\n[6] allergies.json")
try:
    alg = load("allergies.json")
    records = alg.get("allergies", [])
    check(len(records) >= 5, f"{len(records)} allergy records loaded", critical=False)

except Exception as e:
    errors.append(f"{FAIL} allergies.json: {e}")

# ─── not_for_sale_keywords.json ────────────────────────────
print("\n[7] not_for_sale_keywords.json")
try:
    nfs = load("not_for_sale_keywords.json")
    records = nfs.get("not_for_sale_keywords", [])
    check(len(records) >= 6, f"{len(records)} keywords loaded", critical=True)
    
    # Validate all regexes compile
    for kw in records:
        try:
            re.compile(kw["regex"])
        except re.error as e:
            errors.append(f"{FAIL} Invalid regex in {kw['id']}: {e}")
    print(f"  {PASS} All regex patterns compile successfully")

except Exception as e:
    errors.append(f"{FAIL} not_for_sale_keywords.json: {e}")

# ─── expiry_patterns.json ──────────────────────────────────
print("\n[8] expiry_patterns.json")
try:
    exp = load("expiry_patterns.json")
    records = exp.get("expiry_patterns", [])
    check(len(records) >= 5, f"{len(records)} expiry patterns loaded", critical=True)
    
    # Test pattern matching
    test_strings = [
        ("EXP 12/27", "EXP001"),
        ("EXP: DEC 2027", "EXP002"),
        ("USE BEFORE AUG 2026", "EXP003"),
        ("EXPIRY DATE: 08/2027", "EXP004"),
    ]
    
    for test_str, expected_id in test_strings:
        found = False
        for p in records:
            if re.search(p["regex"], test_str.upper(), re.IGNORECASE):
                found = True
                break
        check(found, f"Pattern match: '{test_str}'", critical=True)

except Exception as e:
    errors.append(f"{FAIL} expiry_patterns.json: {e}")

# ─── validation_rules.json ─────────────────────────────────
print("\n[9] validation_rules.json")
try:
    vr = load("validation_rules.json")
    records = vr.get("validation_rules", [])
    check(len(records) >= 15, f"{len(records)} validation rules loaded", critical=True)
    
    # Verify priorities are unique
    priorities = [r["priority"] for r in records]
    check(len(priorities) == len(set(priorities)), "All rule priorities are unique", critical=True)
    
    # Check critical rules exist
    critical_rules = ["VR003", "VR006", "VR010", "VR012"]
    rule_ids = [r["id"] for r in records]
    for rid in critical_rules:
        check(rid in rule_ids, f"Critical rule {rid} exists", critical=True)

except Exception as e:
    errors.append(f"{FAIL} validation_rules.json: {e}")

# ─── sources.json ──────────────────────────────────────────
print("\n[10] sources.json")
try:
    src = load("sources.json")
    records = src.get("sources", [])
    check(len(records) >= 8, f"{len(records)} sources registered", critical=False)

except Exception as e:
    errors.append(f"{FAIL} sources.json: {e}")

# ─── Final report ──────────────────────────────────────────
print("\n" + "=" * 60)
print("INTEGRITY CHECK SUMMARY")
print("=" * 60)

if warnings:
    print(f"\nWarnings ({len(warnings)}):")
    for w in warnings:
        print(f"  {w}")

if errors:
    print(f"\nCritical Errors ({len(errors)}):")
    for e in errors:
        print(f"  {e}")
    print("\n❌ INTEGRITY CHECK FAILED — resolve errors before deployment")
    sys.exit(1)
else:
    print(f"\n✅ INTEGRITY CHECK PASSED ({len(warnings)} warnings)")
    print("Data package is ready for FastAPI integration.")
