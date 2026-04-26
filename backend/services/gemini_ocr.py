# backend/services/gemini_ocr.py

import google.generativeai as genai
from PIL import Image
import io
import json
import logging
import os
from typing import Dict

logger = logging.getLogger(__name__)

class GeminiOCRService:
    def __init__(self, api_key: str = None):
        if not api_key:
            api_key = os.getenv("GEMINI_API_KEY")
        
        if not api_key:
            raise ValueError("GEMINI_API_KEY is required. Get it from: https://aistudio.google.com/")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash-lite')
        
    async def extract_medicine_info(self, image_bytes: bytes) -> Dict:
        try:
            image = Image.open(io.BytesIO(image_bytes))
            
            # Resize if too large
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
            
            response = self.model.generate_content([prompt, image])
            response_text = response.text.strip()
            
            # Clean response
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            extracted = json.loads(response_text)
            
            return {
                "success": True,
                "extracted": extracted,
                "error": None
            }
            
        except Exception as e:
            logger.error(f"Gemini OCR error: {e}")
            return {
                "success": False,
                "extracted": {},
                "error": str(e)
            }