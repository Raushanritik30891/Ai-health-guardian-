# backend/routers/scanner.py

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, List
import json
import logging
import os
import io
from PIL import Image
import google.generativeai as genai
from services.data_loader import get_medicines, resolve_to_generic, get_alternatives, get_prices


router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Fallback: try to read from .env.example if not found in environment
if not GEMINI_API_KEY:
    try:
        env_files = [".env", ".env.example"]
        for env_file in env_files:
            file_path = os.path.join(os.path.dirname(__file__), "..", env_file)
            if os.path.exists(file_path):
                with open(file_path, "r") as f:
                    for line in f:
                        if line.startswith("GEMINI_API_KEY="):
                            GEMINI_API_KEY = line.strip().split("=", 1)[1].strip()
                            break
            if GEMINI_API_KEY:
                break
    except Exception as e:
        logger.error(f"Error reading env files: {e}")

gemini_model = None

if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel('gemini-2.5-flash-lite')
        logger.info("✅ Gemini API initialized")
    except Exception as e:
        logger.error(f"❌ Gemini init failed: {e}")
else:
    logger.warning("⚠️ GEMINI_API_KEY not set")


def find_medicine_in_db(medicine_name: str):
    """Search medicines.json dataset via data_loader resolve + linear scan."""
    if not medicine_name:
        return None, None
    name_lower = medicine_name.lower().strip()
    # Try alias resolution first
    generic = resolve_to_generic(name_lower)
    target = generic if generic else name_lower
    # Linear scan through medicines list
    for med in get_medicines():
        brand = med.get("brand_name", "").lower()
        gen = med.get("generic_name", "").lower()
        salt = med.get("salt", "").lower()
        aliases = [a.lower() for a in med.get("searchable_aliases", [])]
        if target in (brand, gen, salt) or target in aliases:
            # Return in normalized format
            return gen, {
                "genericName": med.get("generic_name", ""),
                "brandName": med.get("brand_name", ""),
                "strength": med.get("strength", ""),
                "class": med.get("category", ""),
                "uses": med.get("uses", []),
                "sideEffects": med.get("side_effects", []),
                "contraindications": med.get("contraindications", []),
                "pregnancySafe": med.get("pregnancy_safe"),
                "kidneyRisk": med.get("kidney_risk", ""),
                "liverRisk": med.get("liver_risk", ""),
                "prescriptionRequired": med.get("prescription_required", True),
                "isOTC": med.get("otc", False),
            }
    return None, None

# Re-export as dataset_find_medicine for compatibility
dataset_find_medicine = find_medicine_in_db

async def get_medicine_info_from_gemini(medicine_name: str) -> Dict:
    """Get medicine information from Gemini API when not in database"""
    if not gemini_model:
        return None
    
    try:
        prompt = f"""You are a medical information system. Provide information about the medicine "{medicine_name}" in India.

Return ONLY valid JSON with this exact structure:
{{
    "generic_name": "main generic name",
    "brand_names": ["brand1", "brand2", "brand3"],
    "category": "drug category",
    "uses": "main uses (1 line)",
    "dosage": "standard dosage",
    "otc": true/false,
    "side_effects": ["effect1", "effect2", "effect3"],
    "contraindications": ["condition1", "condition2"],
    "precautions": "important precautions"
}}

If you're not sure about any field, provide best available information from medical knowledge.
For Indian medicines, use standard Indian dosages.
"""
        
        response = gemini_model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Clean response
        cleaned_text = response_text.replace('```json', '').replace('```', '').strip()
        
        med_info = json.loads(cleaned_text)
        med_info["from_database"] = False
        med_info["source"] = "Gemini AI"
        
        return med_info
        
    except Exception as e:
        logger.error(f"Gemini lookup error: {e}")
        return None


def get_personalized_risks(med_data: Dict, profile: Dict) -> List[Dict]:
    """Generate personalized risk alerts"""
    risks = []
    
    if not profile or not med_data:
        return risks
    
    diseases = [d.lower() for d in profile.get("diseases", [])]
    allergies = [a.lower() for a in profile.get("allergies", [])]
    current_meds = [m.lower() for m in profile.get("currentMedicines", [])]
    
    # Dengue warning
    if med_data.get("danger_dengue") and any("dengue" in d for d in diseases):
        risks.append({
            "type": "danger",
            "title": "⚠️ CRITICAL WARNING",
            "message": "You have DENGUE! This medicine can cause severe bleeding. DO NOT TAKE without doctor's advice!"
        })
    
    # Allergy checks
    generic = med_data.get("generic_name", "").lower()
    if "amoxicillin" in generic or "penicillin" in generic:
        if any("penicillin" in a for a in allergies):
            risks.append({
                "type": "danger",
                "title": "🚫 ALLERGY ALERT",
                "message": "You have PENICILLIN allergy. This medicine could cause severe reaction!"
            })
    
    if "ibuprofen" in generic or "aspirin" in generic or "nsaid" in generic:
        if any("nsaid" in a or "aspirin" in a for a in allergies):
            risks.append({
                "type": "danger",
                "title": "🚫 ALLERGY ALERT",
                "message": "You have NSAID allergy. Avoid this medicine. Consult doctor."
            })
    
    # Disease-specific warnings
    if "ibuprofen" in generic or "aspirin" in generic:
        if any("kidney" in d for d in diseases):
            risks.append({
                "type": "warning",
                "title": "⚠️ KIDNEY DISEASE WARNING",
                "message": "NSAIDs can worsen kidney function. Consult your doctor before use."
            })
        if any("stomach" in d or "ulcer" in d for d in diseases):
            risks.append({
                "type": "warning",
                "title": "⚠️ STOMACH ULCER WARNING",
                "message": "This medicine can irritate stomach. Take with food. Consult doctor."
            })
    
    if "paracetamol" in generic:
        if any("liver" in d for d in diseases):
            risks.append({
                "type": "warning",
                "title": "⚠️ LIVER DISEASE WARNING",
                "message": "Reduce paracetamol dose to max 2g/day. Avoid alcohol."
            })
    
    # Prescription reminder
    if not med_data.get("otc", False):
        risks.append({
            "type": "info",
            "title": "📋 PRESCRIPTION REQUIRED",
            "message": "This medicine requires a doctor's prescription. Do not self-medicate."
        })
    
    return risks


@router.post("/scan-image")
async def scan_medicine_image(
    file: UploadFile = File(...),
    user_profile: Optional[str] = Form(None)
):
    """Scan medicine strip using OCR with database + Gemini fallback"""
    
    # Validate file
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "Please upload an image file")
    
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(400, "Image too large. Max 10MB")
    
    # Read image
    image_bytes = await file.read()
    
    # Step 1: Extract medicine name and details using OCR
    extracted_name = None
    ocr_raw_text = ""
    ocr_extracted = {}
    
    if not gemini_model:
        logger.warning("No Gemini API key! Using fallback OCR result for demo.")
        extracted_name = "Paracetamol"
        ocr_extracted = {
            "medicine_name": "Paracetamol",
            "brand_name": "Crocin Advance",
            "dosage_strength": "500mg"
        }
        ocr_raw_text = "Demo OCR extracted Paracetamol 500mg"
    else:
        try:
            image = Image.open(io.BytesIO(image_bytes))
            if image.size[0] > 1500 or image.size[1] > 1500:
                image.thumbnail((1500, 1500))
            
            prompt = """Extract medicine information from this image. Return ONLY valid JSON with these fields (omit if not found):
{
    "medicine_name": "name of medicine",
    "brand_name": "brand name if visible", 
    "dosage_strength": "e.g., 500mg",
    "manufacturer": "company name",
    "batch_number": "batch number",
    "expiry_date": "EXP date",
    "mrp": "price"
}

Medicine names can be: Paracetamol, Crocin, Dolo, Ibuprofen, Brufen, Amoxicillin, Amoxil, Cetirizine, Zyrtec, Omeprazole, Omez, Metformin, Glycomet

Return ONLY JSON, no other text."""
            
            response = gemini_model.generate_content([prompt, image])
            response_text = response.text.strip()
            ocr_raw_text = response_text
            
            # Clean response more robustly
            cleaned_text = response_text.replace('```json', '').replace('```', '').strip()
            
            try:
                ocr_extracted = json.loads(cleaned_text)
                extracted_name = ocr_extracted.get("medicine_name") or ocr_extracted.get("brand_name")
                logger.info(f"OCR extracted: {extracted_name}")
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON from Gemini. Cleaned text: {cleaned_text}, Error: {e}")
                extracted_name = None
                
        except Exception as e:
            logger.error(f"OCR extraction error: {e}")
            extracted_name = None
    
    if not extracted_name or extracted_name == "UNKNOWN":
        return {
            "success": False,
            "medicine_found": False,
            "message": "Could not detect medicine name in image. Please ensure clear text or search manually.",
            "ocr_text": ocr_raw_text,
            "ocr_extracted": ocr_extracted
        }
    
    # Step 2: Search in REAL dataset (medicines.json)
    med_key, med_data = find_medicine_in_db(extracted_name)
    
    # Convert dataset format to scanner-compatible format
    if med_data and isinstance(med_data, dict) and "genericName" in med_data:
        med_data = {
            "generic_name": med_data.get("genericName", ""),
            "brand_names": [med_data.get("brandName", "")],
            "category": med_data.get("class", ""),
            "uses": ", ".join(med_data.get("uses", [])),
            "dosage": f"Strength: {med_data.get('strength', 'See packaging')}",
            "otc": med_data.get("isOTC", False),
            "side_effects": med_data.get("sideEffects", []),
            "contraindications": med_data.get("contraindications", []),
            "precautions": f"Kidney risk: {med_data.get('kidneyRisk','')} | Liver risk: {med_data.get('liverRisk','')}",
            "pregnancy_safe": med_data.get("pregnancySafe"),
            "prescription_required": med_data.get("prescriptionRequired", True),
            "from_database": True,
            "source": "medicines.json",
        }
    
    # Step 3: If not in database, use Gemini
    if not med_data and gemini_model:
        med_data = await get_medicine_info_from_gemini(extracted_name)
        med_key = extracted_name.lower().replace(" ", "_")
    
    # Parse user profile
    profile = {}
    if user_profile:
        try:
            profile = json.loads(user_profile)
        except:
            pass
    
    # Get personalized risks
    risks = []
    if med_data:
        risks = get_personalized_risks(med_data, profile)
    
    # Prepare response
    if med_data:
        return {
            "success": True,
            "medicine_found": True,
            "medicine_key": med_key,
            "medicine_data": med_data,
            "personalized_risks": risks,
            "ocr_text": extracted_name,
            "ocr_extracted": ocr_extracted,
            "source": med_data.get("source", "database")
        }
    else:
        return {
            "success": True,
            "medicine_found": False,
            "message": f"Medicine '{extracted_name}' detected but information not available. Please consult a doctor.",
            "ocr_text": extracted_name,
            "ocr_extracted": ocr_extracted,
            "suggestions": [m.get("brand_name") for m in get_medicines()[:5]]
        }


@router.post("/search-by-name")
async def search_medicine_by_name(
    medicine_name: str = Form(...),
    user_profile: Optional[str] = Form(None)
):
    """Search medicine by name - Database first, then Gemini fallback"""
    
    if not medicine_name.strip():
        raise HTTPException(400, "Please provide a medicine name")
    
    # Step 1: Search in local database
    med_key, med_data = find_medicine_in_db(medicine_name)
    
    # Step 2: If not found, use Gemini API
    if not med_data and gemini_model:
        med_data = await get_medicine_info_from_gemini(medicine_name)
        med_key = medicine_name.lower().replace(" ", "_")
    
    # Step 3: If still not found, return error
    if not med_data:
        # Provide suggestions from database
        suggestions = [m.get("brand_name") for m in get_medicines()[:5]]
        raise HTTPException(
            404, 
            detail={
                "message": f"Medicine '{medicine_name}' not found",
                "suggestions": suggestions,
                "tip": "Try searching with generic name (Paracetamol instead of Crocin)"
            }
        )
    
    # Parse profile
    profile = {}
    if user_profile:
        try:
            profile = json.loads(user_profile)
        except:
            pass
    
    # Get risks
    risks = get_personalized_risks(med_data, profile)
    
    return {
        "success": True,
        "medicine_key": med_key,
        "medicine_data": med_data,
        "personalized_risks": risks,
        "source": med_data.get("source", "database")
    }


@router.get("/suggestions/{partial_name}")
async def get_suggestions(partial_name: str):
    """Get medicine name suggestions for autocomplete"""
    if len(partial_name) < 2:
        return {"suggestions": []}
    
    partial = partial_name.lower()
    suggestions = set()
    
    # Search in database
    for med in get_medicines():
        brand_names = [med.get("brand_name", "")] + med.get("searchable_aliases", [])
        
        if any(partial in b.lower() for b in brand_names):
            suggestions.add(med.get("brand_name", "").title())
        
        if partial in med.get("generic_name", "").lower():
            suggestions.add(med["generic_name"])
    
    return {"suggestions": list(suggestions)[:10]}


@router.get("/barcode/{barcode}")
async def scan_barcode(barcode: str):
    """Lookup medicine by barcode"""
    
    # Demo barcode mapping
    barcode_map = {
        "8901234567890": "paracetamol",
        "8902345678901": "ibuprofen",
        "8903456789012": "amoxicillin",
        "8904567890123": "cetirizine",
        "8905678901234": "omeprazole",
        "8906789012345": "metformin",
    }
    
    med_key = barcode_map.get(barcode)
    if med_key:
        med = dataset_find_medicine(med_key)
        if med:
            return {
                "success": True,
                "barcode": barcode,
                "medicine_key": med_key,
                "medicine_data": med,
                "source": "medicines.json",
            }

    return {
        "success": False,
        "barcode": barcode,
        "message": "Barcode not found in database. Try searching by name or uploading image."
    }


# ── /strip alias — used by the frontend Scanner page ─────────────────────────
@router.post("/strip")
async def scan_strip(
    file: UploadFile = File(...),
    user_profile: Optional[str] = Form(None)
):
    """
    Alias for /scan-image — handles medicine strip photo scan.
    Frontend calls POST /api/scanner/strip.
    """
    return await scan_medicine_image(file=file, user_profile=user_profile)


@router.post("/prescription")
async def scan_prescription(
    file: UploadFile = File(...),
    user_profile: Optional[str] = Form(None)
):
    """
    Handles doctor's prescription OCR.
    Extracts a list of medicine names.
    """
    # Validate file
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "Please upload an image file")
    
    image_bytes = await file.read()
    
    if not gemini_model:
        # Fallback for demo without API key
        return {
            "success": True,
            "medicines": ["Dolo 650", "Pantop 40", "Mox 500"],
            "confidence": 0.85,
            "message": "Demo mode: Gemini API not available."
        }

    try:
        image = Image.open(io.BytesIO(image_bytes))
        # Resize if too large
        if image.size[0] > 1500 or image.size[1] > 1500:
            image.thumbnail((1500, 1500))
        
        prompt = """Extract ALL medicine names from this doctor's prescription image.
Return ONLY valid JSON with this structure:
{
    "medicines": ["Name 1", "Name 2", ...],
    "confidence": 0.0-1.0
}
Extract brand names if possible, otherwise generic names.
Return ONLY JSON, no other text."""
        
        response = gemini_model.generate_content([prompt, image])
        response_text = response.text.strip()
        
        # Clean response
        cleaned_text = response_text.replace('```json', '').replace('```', '').strip()
        result = json.loads(cleaned_text)
        
        return {
            "success": True,
            "medicines": result.get("medicines", []),
            "confidence": result.get("confidence", 0.8)
        }
    except Exception as e:
        logger.error(f"Prescription OCR error: {e}")
        return {
            "success": False,
            "message": "Failed to read prescription. Please ensure the photo is clear.",
            "error": str(e)
        }

class PersonalizedCheckRequest(BaseModel):
    medicine_data: dict
    user_profile: dict
    language: str = "en"

@router.post("/personalized-check")
async def personalized_check(req: PersonalizedCheckRequest):
    """Generate personalized outcome using Gemini based on specific user profile & dataset"""
    if not gemini_model:
        return {"success": False, "message": "Gemini API not available for personalized check."}
        
    lang_instruction = "Hindi (clear, simple Hindi)" if req.language == "hi" else "English"
        
    prompt = f"""
You are an expert AI medical assistant.
Medicine Details from our dataset: {json.dumps(req.medicine_data)}
User's Profile (Age, Gender, Pregnancy, Conditions, Allergies): {json.dumps(req.user_profile)}

Task: Analyze the safety of this medicine specifically for this user based ONLY on their provided profile and the medicine's dataset information.
Think step-by-step internally, but output ONLY a valid JSON object matching the schema below.
Output ALL your text (explanation, alerts, positives) completely in {lang_instruction}.

Structure:
{{
    "verdict": "safe" | "caution" | "avoid",
    "explanation": "A detailed 3-5 sentence explanation in {lang_instruction} of why this medicine is safe or dangerous specifically for this user's profile based on the dataset.",
    "alerts": [
        {{"text": "Warning alert in {lang_instruction}."}}
    ],
    "positives": [
        {{"text": "Positive note in {lang_instruction}."}}
    ]
}}

If the conditions make it completely unsafe (like a known allergy or severe contraindication), set verdict to "avoid" and add critical alerts.
If there's a risk but not absolute contraindication, set verdict to "caution".
If perfectly safe for their conditions, set verdict to "safe".
Ensure no markdown code blocks are in the output. ONLY raw JSON.
"""
    try:
        response = gemini_model.generate_content(prompt)
        cleaned_text = response.text.strip().replace('```json', '').replace('```', '').strip()
        outcome = json.loads(cleaned_text)
        return {"success": True, "outcome": outcome}
    except Exception as e:
        logger.error(f"Personalized check error: {e}")
        return {"success": False, "message": "Failed to generate AI report."}