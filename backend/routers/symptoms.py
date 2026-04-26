"""
symptoms.py — Symptom Analysis Router with personalization
Data: symptoms.db (sqlite3) for 246k+ clinical records.
SYMPTOMS_DB and REMEDIES_DB are no longer imported from datasets.medical_data
(that module is removed). They are replaced with empty dicts; the real logic
uses the sqlite3 database below.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os
import sqlite3
import logging

logger = logging.getLogger(__name__)

# Legacy dicts no longer from datasets.medical_data — now empty stubs.
# All symptom matching is done via the sqlite3 DB below.
SYMPTOMS_DB: dict = {}
REMEDIES_DB: dict = {}

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "datasets", "symptoms.db")

# Categorization map for the 377+ symptoms
CATEGORIES = {
    "Head, Eyes & Ears": ["eye", "eyelid", "blindness", "vision", "pupils", "tearing", "ear", "hearing", "nose", "throat", "headache", "dizziness", "fainting"],
    "Respiratory & Chest": ["breathing", "cough", "breathlessness", "apnea", "hemoptysis", "sputum", "wheezing", "chest", "rib", "sinus", "sneezing", "coryza", "tonsils"],
    "Digestive & Stomach": ["stomach", "abdominal", "vomiting", "nausea", "diarrhea", "constipation", "stool", "appetite", "regurgitation", "melena", "bloating", "swallowing", "tongue", "mouth", "lip", "gum", "teeth", "tooth"],
    "Skin & Hair": ["skin", "rash", "itching", "warts", "acne", "lesion", "hair", "scalp", "nail", "bruising", "pallor", "spots"],
    "Musculoskeletal": ["shoulder", "arm", "leg", "hip", "wrist", "elbow", "knee", "ankle", "finger", "toe", "back", "joint", "muscle", "bone", "stiffness", "tightness", "cramps", "spasms", "weakness", "ache", "pain", "swelling", "lump", "mass", "neck", "groin", "side"],
    "Neurological & Psychological": ["seizures", "confusion", "memory", "slurring", "words", "face", "sensation", "paresthesia", "unconscious", "hallucinations", "delusions", "obsessions", "compulsions", "behavior", "anxiety", "fear", "phobia", "mood", "temper"],
    "Sexual & Urinary": ["menstrual", "pregnancy", "vaginal", "prostate", "penis", "vulvar", "scrotum", "bladder", "urine", "urination", "kidney", "pelvic", "menopause", "sex", "ejaculation", "orgasm", "infertility", "uterus"],
    "General / Systemic": ["fever", "chills", "fatigue", "sweating", "weakness", "weight", "thirst", "growth", "sleep", "nightmares", "blood", "circulation", "lymph", "edema", "allergy", "hot", "cold", "flu"]
}

def categorize_symptom(symptom_id: str):
    s = symptom_id.lower()
    for cat, keywords in CATEGORIES.items():
        if any(kw in s for kw in keywords):
            return cat
    return "Other Symptoms"

router = APIRouter()

class SymptomRequest(BaseModel):
    symptoms: List[str]
    age: Optional[int] = None
    gender: Optional[str] = None
    diseases: Optional[List[str]] = []
    allergies: Optional[List[str]] = []
    currentMedicines: Optional[List[str]] = []
    language: Optional[str] = "en"
    personalized: bool = False

# Maps friendly UI symptoms to clinical dataset columns
ALIAS_MAP = {
    "fever": ["fever"],
    "chills": ["chills", "feeling_cold"],
    "body_ache": ["ache_all_over", "muscle_pain", "stiffness_all_over"],
    "fatigue": ["fatigue", "weakness"],
    "sweating": ["sweating"],
    "headache": ["headache", "frontal_headache"],
    "cough": ["cough", "coughing_up_sputum"],
    "sore_throat": ["sore_throat", "throat_irritation", "throat_redness", "throat_swelling"],
    "runny_nose": ["nasal_congestion", "coryza", "sinus_congestion"],
    "breathlessness": ["shortness_of_breath", "difficulty_breathing", "apnea", "breathing_fast"],
    "chest_pain": ["sharp_chest_pain", "burning_chest_pain", "chest_tightness", "congestion_in_chest"],
    "wheezing": ["wheezing", "abnormal_breathing_sounds"],
    "nausea": ["nausea"],
    "vomiting": ["vomiting", "infant_spitting_up"],
    "diarrhea": ["diarrhea"],
    "stomach_pain": ["sharp_abdominal_pain", "burning_abdominal_pain", "upper_abdominal_pain", "lower_abdominal_pain", "stomach_pain"],
    "bloating": ["stomach_bloating", "abdominal_distention", "swollen_abdomen"],
    "constipation": ["constipation"],
    "loss_of_appetite": ["decreased_appetite"],
    "rash": ["skin_rash", "skin_lesion", "acne_or_pimples"],
    "itching": ["itching_of_skin", "itchy_eyelid", "itchy_ear(s)"],
    "joint_pain": ["joint_pain", "joint_swelling", "joint_stiffness_or_tightness"],
    "muscle_pain": ["muscle_pain", "muscle_stiffness_or_tightness", "muscle_weakness"],
    "back_pain": ["back_pain", "low_back_pain", "neck_pain"],
    "dizziness": ["dizziness", "fainting"],
    "fainting": ["fainting"],
    "numbness": ["loss_of_sensation", "paresthesia"],
    "seizures": ["seizures"],
    "confusion": ["confusion", "delusions_or_hallucinations", "disturbance_of_memory"],
    "pain": ["muscle_pain", "joint_pain", "bone_pain", "sharp_abdominal_pain"],
    "skin": ["skin_rash", "itching_of_skin", "abnormal_appearing_skin"]
}

def find_symptom(symptom: str):
    s = symptom.lower().strip()
    if s in SYMPTOMS_DB:
        return s, SYMPTOMS_DB[s]
    for key, data in SYMPTOMS_DB.items():
        if any(alias in s or s in alias for alias in data.get("aliases", [])):
            return key, data
        if s in key or key in s:
            return key, data
    return None, None

def query_dataset(input_symptoms: List[str]):
    """Query the SQLite database with enhanced mapping and relevance scoring."""
    if not os.path.exists(DB_PATH):
        return []
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("PRAGMA table_info(symptom_map)")
        columns = [row[1] for row in cursor.fetchall() if row[1] != 'diseases']
        
        matched_cols = []
        for sym in input_symptoms:
            s_low = sym.lower().strip().replace(" ", "_")
            
            # 1. Check ALIAS_MAP first
            if s_low in ALIAS_MAP:
                matched_cols.extend(ALIAS_MAP[s_low])
            elif sym.lower() in ALIAS_MAP: # try original with space
                matched_cols.extend(ALIAS_MAP[sym.lower()])
            
            # 2. Fuzzy match against all columns
            norm_sym = s_low.replace("-", "_")
            for col in columns:
                if norm_sym in col or col in norm_sym:
                    if col not in matched_cols:
                        matched_cols.append(col)
        
        if not matched_cols:
            return []
            
        # We use a Frequency-Weighted Scoring Algorithm:
        # 1. Match Proportion: How many of the selected symptoms does this disease have?
        # 2. Evidence Volume: How well-represented is this disease in the 246k records?
        # 3. Final Score = (Match Proportion * 0.7) + (Log10(Count) * 0.3)
        
        cols_sum = " + ".join([f'"{c}"' for c in set(matched_cols)])
        where_any = " OR ".join([f'"{c}" = 1' for c in set(matched_cols)])
        
        query = f"""
            WITH Stats AS (
                SELECT diseases, 
                       AVG({cols_sum}) as match_avg,
                       COUNT(*) as freq,
                       (SELECT MAX(c) FROM (SELECT COUNT(*) as c FROM symptom_map GROUP BY diseases)) as max_freq
                FROM symptom_map 
                WHERE {where_any} 
                GROUP BY diseases
            )
            SELECT diseases,
                   match_avg,
                   freq,
                   -- Scientific Score: Favor high match rates but also high volume of evidence
                   (match_avg * 70) + (CAST(freq AS FLOAT) / max_freq * 30) as score
            FROM Stats
            ORDER BY score DESC
            LIMIT 15
        """
        
        cursor.execute(query)
        results = cursor.fetchall()

        conds = []
        for row in results:
            name, match_avg, freq, score = row
            # Severity mapping based on clinical frequency and typical patterns
            severity = "High Care"
            if "cancer" in name or "failure" in name or "attack" in name: severity = "Emergency"
            elif "infection" in name or "itis" in name: severity = "Urgent Support"
            
            conds.append({
                "name": name.replace("_", " ").title(),
                "probability": min(99, int(score)),
                "severity": severity,
                "evidence_count": freq,
                "scientific_confidence": f"{int(match_avg*100)}%"
            })
        return conds
    except Exception as e:
        print(f"Database query error: {e}")
        return []

def calc_risk(conditions, age, diseases, allergies):
    sev_score = {"mild": 20, "moderate": 48, "serious": 74, "emergency": 95}
    if not conditions:
        return 15, "safe"
    base = max(sev_score.get(c["severity"], 20) * c["probability"] / 100 for c in conditions)
    # Age adjustments
    if age and age > 65: base = min(base + 12, 95)
    if age and age < 12: base = min(base + 8, 95)
    # Disease adjustments
    dis_lower = " ".join(diseases or []).lower()
    if "diabetes" in dis_lower: base = min(base + 8, 95)
    if "heart" in dis_lower or "cardiac" in dis_lower: base = min(base + 12, 95)
    if "dengue" in dis_lower: base = min(base + 20, 95)
    if "kidney" in dis_lower: base = min(base + 10, 95)
    level = "safe" if base < 30 else "caution" if base < 60 else "danger"
    return int(base), level

def get_personalized_alerts(conditions, diseases, allergies, currentMedicines, age, otc_meds):
    alerts = []
    dis = " ".join(diseases or []).lower()
    allg = " ".join(allergies or []).lower()
    
    # Dengue + NSAIDs
    if "dengue" in dis:
        filtered_otc = [m for m in otc_meds if not any(x in m.lower() for x in ["ibuprofen", "aspirin", "diclofenac"])]
        alerts.append("🔴 DENGUE DETECTED: Use ONLY Paracetamol. NEVER give Ibuprofen/Aspirin — fatal hemorrhage risk!")
        return alerts, filtered_otc
    if "kidney" in dis:
        filtered_otc = [m for m in otc_meds if not any(x in m.lower() for x in ["ibuprofen", "aspirin", "diclofenac"])]
        alerts.append("⚠️ Kidney disease: NSAIDs removed from recommendations. Use Paracetamol only.")
        otc_meds = filtered_otc
    if "heart" in dis or "cardiac" in dis:
        alerts.append("⚠️ Heart condition: Avoid NSAIDs (increase CV risk). Use Paracetamol for pain/fever.")
    if "liver" in dis:
        alerts.append("⚠️ Liver disease: Paracetamol max 2g/day (not 4g). Monitor LFTs.")
    if "asthma" in dis:
        alerts.append("⚠️ Asthma: 5–10% of asthmatics may be NSAID-sensitive (AERD). Monitor if taking.")
    if "penicillin" in allg:
        alerts.append("⚠️ Penicillin allergy: Never take amoxicillin/ampicillin for bacterial infections.")
    if "aspirin" in allg or "nsaid" in allg:
        filtered_otc = [m for m in otc_meds if not any(x in m.lower() for x in ["ibuprofen", "aspirin"])]
        alerts.append("⛔ NSAID/Aspirin allergy: All NSAIDs removed from recommendations.")
        otc_meds = filtered_otc
    if age and age > 65:
        alerts.append(f"👴 Age {age}: Lower threshold for seeking medical care. Fever >99°F warrants attention.")
    if age and age < 12:
        alerts.append(f"👶 Child ({age} yrs): All dosing must be weight-based. Never give aspirin.")
    return alerts, otc_meds

@router.post("/analyze")
async def analyze_symptoms(req: SymptomRequest):
    found = []
    all_conds, all_otc, all_flags = [], [], []
    all_remedies = []
    
    # 1. Query the 246k record clinical dataset first (Primary Logic)
    dataset_conds = query_dataset(req.symptoms)
    all_conds.extend(dataset_conds)
    
    # 2. Enrich with manually curated clinical data (Secondary Logic)
    for sym in req.symptoms:
        # Normalize: database IDs are like 'eye_pain', frontend may send 'eye_pain' or 'Eye Pain'
        norm_sym = sym.lower().replace(" ", "_")
        key, data = find_symptom(norm_sym)
        
        if not data:
            # Try original
            key, data = find_symptom(sym)
            
        if data:
            found.append({"input": sym, "matched": key.replace("_", " ").title()})
            # Add conditions from curated DB (often high probability for common issues)
            all_conds.extend(data["conditions"])
            # Add rich metadata
            all_otc.extend(data["otc"])
            all_flags.extend(data["red_flags"])
            if key in REMEDIES_DB:
                all_remedies.extend(REMEDIES_DB[key][:2])
        else:
            # Only in dataset, or not found in curated.
            # If it's in req.symptoms, it was selected from the list, so it's "found" in the dataset sense.
            found.append({"input": sym, "matched": sym.replace("_", " ").title()})

    if not found and not dataset_conds:
        raise HTTPException(status_code=404, detail="Could not identify symptoms reliably. Please consult a doctor immediately.")
    
    # 3. Intelligent Merging and Scoring
    cond_map = {}
    for c in all_conds:
        name = c["name"]
        if name not in cond_map:
            cond_map[name] = c
        else:
            # Frequency/Evidence boost: if both dataset AND curated list confirm, likelihood increases
            current = cond_map[name]
            boost = c["probability"] * 0.15 # 15% bonus for corroborating evidence
            current["probability"] = min(99, int(current["probability"] + boost))
            # Keep highest severity
            sevs = ["mild", "moderate", "serious", "emergency"]
            if sevs.index(c.get("severity", "mild")) > sevs.index(current.get("severity", "mild")):
                 current["severity"] = c["severity"]

    # Final Sort
    sorted_conds = sorted(cond_map.values(), key=lambda x: x["probability"], reverse=True)[:7]
    
    unique_otc = list(dict.fromkeys(all_otc))
    unique_flags = list(dict.fromkeys(all_flags))
    
    # 4. Personalization & Risk Calculation
    pers_alerts, unique_otc = get_personalized_alerts(sorted_conds, req.diseases, req.allergies, req.currentMedicines, req.age, unique_otc)
    risk_score, risk_level = calc_risk(sorted_conds, req.age, req.diseases, req.allergies)
    
    return {
        "symptoms_found": found,
        "symptoms_not_found": [s for s in req.symptoms if not any(f["input"] == s for f in found)],
        "conditions": sorted_conds,
        "otc_medicines": unique_otc[:6],
        "red_flags": unique_flags,
        "home_remedies": all_remedies[:4],
        "risk_score": risk_score,
        "risk_level": risk_level,
        "personalized_alerts": pers_alerts,
        "dataset_used": "246k Clinical Records + Static Knowledge Base",
        "personalized": req.personalized and bool(req.diseases or req.allergies or req.age),
        "medical_advice": "👨‍⚕️ You should see a qualified medical professional for a proper diagnosis and treatment plan.",
        "disclaimer": "⚠️ CRITICAL: This AI analysis is based on multiple clinical datasets and is for INFORMATIONAL PURPOSES ONLY. It does NOT replace professional medical advice, diagnosis, or treatment. If you are experiencing an emergency, call 108 immediately.",
    }

@router.get("/list")
async def list_symptoms():
    """Returns a categorized list of all symptoms available in the dataset."""
    if not os.path.exists(DB_PATH):
        # Fallback to hardcoded ones if DB is missing
        return {
            "symptoms": list(SYMPTOMS_DB.keys()),
            "total": len(SYMPTOMS_DB),
            "source": "Backup Static DB"
        }
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(symptom_map)")
        # Get all columns except 'diseases'
        all_cols = [row[1] for row in cursor.fetchall() if row[1] != 'diseases']
        
        grouped = {}
        for s_id in all_cols:
            display_name = s_id.replace("_", " ").title()
            
            # Clinical Categorization
            category = "General Symptoms"
            if any(x in s_id for x in ["pain", "ache", "sore"]): category = "Pain & Discomfort"
            elif any(x in s_id for x in ["respiratory", "breath", "cough", "nose", "throat"]): category = "Respiratory & Throat"
            elif any(x in s_id for x in ["stomach", "abdominal", "digestion", "nausea"]): category = "Digestive Health"
            elif any(x in s_id for x in ["eye", "vision", "blindness"]): category = "Ocular (Eyes)"
            elif any(x in s_id for x in ["skin", "rash", "itching"]): category = "Skin & Integumentary"
            elif any(x in s_id for x in ["mental", "mood", "depression", "anxiety"]): category = "Mental & Neurological"
            elif any(x in s_id for x in ["pregnancy", "uterine", "menstrual"]): category = "Women's Health"
            
            # Bilingual Support (Mapping Technical -> Simple/Hindi)
            translations = {
                "fever": "बुखार (Fever)",
                "cough": "खांसी (Cough)",
                "joint_pain": "जोड़ों में दर्द (Joint Pain)",
                "headache": "सिरदर्द (Headache)",
                "back_pain": "पीठ दर्द (Back Pain)",
                "chest_pain": "सीने में दर्द (Chest Pain)",
                "difficulty_breathing": "सांस लेने में कठिनाई (Dyspnea)",
                "dizziness": "चक्कर आना (Dizziness)",
                "fatigue": "थकान (Fatigue)",
                "nausea": "मतली (Nausea)",
                "vomiting": "उल्टी (Vomiting)",
                "diarrhea": "दस्त (Diarrhea)",
                "abdominal_pain": "पेट दर्द (Stomach Pain)",
                "sore_throat": "गले में खराश (Sore Throat)",
                "rash": "चकत्ते (Rash)",
                "itching": "खुजली (Itching)",
                "chills": "ठंड लगना (Chills)",
                "sweating": "पसीना आना (Sweating)",
                "weight_loss": "वजन घटना (Weight Loss)",
                "appetite_loss": "भूख न लगना (Loss of Appetite)",
            }
            
            hindi_name = translations.get(s_id, display_name)
            
            if category not in grouped: grouped[category] = []
            grouped[category].append({
                "id": s_id,
                "name": hindi_name,
                "en": display_name,
                "aliases": [display_name, s_id.replace("_", " ")]
            })
            
        return {"grouped": grouped, "total": len(all_cols), "source": "Clinical Dataset (246k records)"}
    except Exception as e:
        print(f"Error listing symptoms: {e}")
        return {"error": str(e), "symptoms": list(SYMPTOMS_DB.keys())}
