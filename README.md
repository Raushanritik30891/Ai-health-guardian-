# 🛡️ AI Health Guardian v3
## India ka Smart Health Assistant — Hindi & English

> Verified data · Clean UI · Gemini AI · Works on mobile

---

## ✅ v3 Changes (Fully Fixed)

| Issue | Status |
|---|---|
| All pages were stubs (🚧) | ✅ All 12 pages fully working |
| Navigation bug (activePage not working) | ✅ Fixed |
| Claude API → Gemini API | ✅ Switched to gemini-2.0-flash |
| No language selection | ✅ Hindi/English screen on first open |
| AI-generated dark UI | ✅ Clean white UI, mobile-friendly |
| Dataset sources unclear | ✅ All sources verified + listed |

---

## 🚀 Quick Start

### Frontend Only (No Backend Needed)
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
# Click "API Key" in AI Chat → enter free Gemini key
```

### With Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Add GEMINI_API_KEY to .env
uvicorn main:app --reload --port 8000
```

---

## 🔑 Get Free Gemini API Key
1. Go to: https://aistudio.google.com
2. Click "Get API Key" → Create key
3. In the app: AI Chat → "API Key" button → paste key
4. Key is stored on your device only (localStorage)

---

## 📊 Verified Data Sources

| Data | Source | Official Link |
|---|---|---|
| Medicine info | WHO EML 2023 | who.int/publications |
| Drug prices | NPPA India | nppaindia.nic.in |
| Generic prices | Jan Aushadhi | janaushadhi.gov.in |
| Drug interactions | BNF 2024, DrugBank | bnf.nice.org.uk |
| Disease-symptom | Kaggle research dataset | kaggle.com |
| Home remedy evidence | Cochrane Reviews | cochranelibrary.com |
| Indian medicines | Indian Pharmacopoeia 2022 | ipc.gov.in |

**No fabricated or AI-generated medical data is used.**

---

## 🤖 For AI Model Training

Best free datasets:
```bash
# Kaggle (easiest)
pip install kaggle
kaggle datasets download shudhanshusingh/indian-medicines-unique-dataset
kaggle datasets download itachi9604/disease-symptom-description-dataset

# OpenFDA (no key)
curl "https://api.fda.gov/drug/label.json?search=openfda.generic_name:paracetamol"
```

Recommended models to fine-tune:
- **google/gemma-2-9b-it** — free, good Hindi support
- **BioMistral-7B** — medical domain pre-trained
- **microsoft/BioGPT** — biomedical text

---

## 📱 Features (All Working)

- 🏠 **Home** — Dashboard with emergency alerts
- 🤒 **Symptom Check** — Rule-based analysis, offline
- 💊 **Medicine Info** — 25+ drugs, WHO/NPPA data
- ⚠️ **Drug Interactions** — 50+ pairs, BNF/DrugBank
- 🔁 **Alternatives** — Jan Aushadhi cheaper options
- 🌿 **Home Remedies** — Evidence grades A/B/C
- 💰 **Price Compare** — NPPA-based price data
- 📸 **Med Scanner** — Name lookup + profile alerts
- 📍 **Nearby Stores** — Jan Aushadhi + emergency numbers
- 🤖 **AI Doctor Chat** — Gemini, Hindi + English
- 👤 **Profile** — Personalization, saved locally
- 📊 **Data Sources** — All verified links

---

## ⚠️ Disclaimer
This app is for **informational purposes only**. It does NOT replace a doctor.
**Emergency: Call 108** · Jan Aushadhi helpline: 1800-180-8080

*Built for India 🇮🇳*
