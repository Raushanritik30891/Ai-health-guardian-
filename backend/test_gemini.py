import os
from dotenv import load_dotenv
import google.generativeai as genai
import json

base_dir = os.path.dirname(os.path.abspath(__file__))
# Try loading .env.example if .env doesn't exist
load_dotenv(os.path.join(base_dir, '.env'))
if not os.getenv('GEMINI_API_KEY'):
    load_dotenv(os.path.join(base_dir, '.env.example'))

api_key = os.getenv('GEMINI_API_KEY')
print(f"API Key found: {'Yes' if api_key else 'No'}")

if api_key:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-flash-latest')
    
    prompt = """Extract medicine information from this text (simulating OCR). Return ONLY valid JSON with these fields (omit if not found):
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

Return ONLY JSON, no other text.

Text: Paracetamol IP 650 mg P-650 Tablets Analgesic and Antipyretic apex Manufactured for: apex laboratories private limited
"""
    
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        print("Raw Response:", text)
        
        if text.startswith('```json'):
            text = text[7:]
        if text.startswith('```'):
            text = text[3:]
        if text.endswith('```'):
            text = text[:-3]
            
        print("Cleaned text:", text)
        data = json.loads(text)
        print("Parsed JSON:", data)
    except Exception as e:
        print("Error:", str(e))
