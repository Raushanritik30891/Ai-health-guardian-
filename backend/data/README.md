# AI Health Guardian — Data Package README

## Folder Structure

```
ai_health_guardian/
├── main.py                          ← FastAPI rule engine
├── data/
│   ├── medicines.json               ← Core medicine records (20/100 seeded)
│   ├── salt_mapping.json            ← Brand → generic → alternatives mapping
│   ├── interactions.json            ← Drug-drug interactions (15 records)
│   ├── contraindications.json       ← Drug-disease contraindications (15 records)
│   ├── allergies.json               ← Allergy-based restrictions (7 records)
│   ├── pregnancy_rules.json         ← Pregnancy safety per medicine (10 records)
│   ├── alternatives.json            ← Cheaper/generic alternatives (8 records)
│   ├── prices.json                  ← Indicative prices (8 records)
│   ├── diseases.json                ← Conditions for user profile (12 records)
│   ├── not_for_sale_keywords.json   ← OCR detection keywords (8 patterns)
│   ├── expiry_patterns.json         ← Expiry date regex patterns (7 patterns)
│   ├── profile_questions.json       ← User profile schema (8 fields)
│   ├── validation_rules.json        ← Safety rule engine (17 rules)
│   └── sources.json                 ← Source registry (10 sources)
└── README.md
```

---

## Data Completeness Status

| File | Seeded Records | Target | Completion | Priority |
|------|---------------|--------|------------|----------|
| medicines.json | 20 | 100 | 20% | CRITICAL |
| salt_mapping.json | 10 | 100 | 10% | HIGH |
| interactions.json | 15 | ~50 | 30% | CRITICAL |
| contraindications.json | 15 | ~60 | 25% | CRITICAL |
| allergies.json | 7 | ~20 | 35% | HIGH |
| pregnancy_rules.json | 10 | ~50 | 20% | CRITICAL |
| alternatives.json | 8 | 100 | 8% | HIGH |
| prices.json | 8 indicative | LIVE | 0% (live needed) | HIGH |
| diseases.json | 12 | 20 | 60% | MEDIUM |
| not_for_sale_keywords.json | 8 | 10 | 80% | HIGH |
| expiry_patterns.json | 7 | 10 | 70% | HIGH |
| profile_questions.json | 8 | 8 | 100% | DONE |
| validation_rules.json | 17 | 20 | 85% | DONE |
| sources.json | 10 | 10 | 100% | DONE |

---

## How to Collect Remaining Data

### 1. medicines.json — Remaining 80 records

**Step 1: Download PMBJP catalog**
- URL: https://janaushadhi.gov.in/ProductList.aspx
- Download the Excel/PDF product list
- Extract: medicine name, salt, strength, dosage form, price

**Step 2: Cross-reference with openFDA**
```bash
curl "https://api.fda.gov/drug/label.json?search=openfda.brand_name:metformin&limit=1"
```
Extract: side_effects (adverse_reactions), contraindications, pregnancy category

**Step 3: Verify prescription status with CDSCO**
- Schedule H = prescription required
- Schedule H1 = strict prescription (controlled)
- Schedule X = narcotic (strict control)
- OTC = no schedule

### 2. interactions.json — Remaining records

**Primary source: openFDA drug interaction endpoint**
```bash
curl "https://api.fda.gov/drug/label.json?search=drug_interactions:warfarin&limit=10"
```

**Also check**: DailyMed full labeling PDFs for each medicine's "Drug Interactions" section.

### 3. prices.json — Live data required

Prices must be scraped fresh at deployment. Recommended approach:
- Use pharmacy APIs if available, otherwise public product pages
- Store with `date_accessed` timestamp
- Re-scrape weekly via cron job
- PMBJP prices are fixed by government and change rarely

### 4. Medicines to add next (priority order for Indian context)

| Medicine | Salt | Category |
|----------|------|----------|
| Pantocid | Pantoprazole | PPI |
| Augmentin 625 | Amoxicillin+Clavulanate | Antibiotic |
| Metpure XL | Metoprolol Succinate | Beta-blocker |
| Telma H | Telmisartan+Hydrochlorothiazide | Antihypertensive combo |
| Glycomet GP | Metformin+Glimepiride | Antidiabetic combo |
| Levipil 500 | Levetiracetam | Antiepileptic |
| Stemetil | Prochlorperazine | Antiemetic |
| Meftal Spas | Mefenamic+Dicyclomine | Antispasmodic |
| Zerodol SP | Aceclofenac+Serratiopeptidase | NSAID combo |
| Benadryl | Diphenhydramine | Antihistamine |
| Clavam 625 | Amoxicillin+Clavulanate | Antibiotic |
| Cetirizine | Cetirizine | Antihistamine |
| Alprazolam | Alprazolam | Anxiolytic (Sch H1) |
| Digene | Aluminium+Magnesium | Antacid |
| Ivermectin | Ivermectin | Antiparasitic |

---

## Missing Fields & Known Gaps

### pregnancy_safe field in medicines.json
- Set to `null` where official Indian SmPC does not explicitly state pregnancy safety
- **Do not infer** from drug class or general knowledge
- Must be populated from DailyMed / openFDA or official package inserts only

### Ranitidine (MED020)
- CDSCO suspended ranitidine approvals in 2020 due to NDMA contamination
- Verify current CDSCO status before including in product
- Reference: https://cdsco.gov.in/opencms/opencms/en/Alerts/

### Price data
- All price records in prices.json are marked `INDICATIVE_ONLY`
- Must be replaced with live-scraped data before production
- MRP is regulated by NPPA (National Pharmaceutical Pricing Authority): https://www.nppaindia.nic.in/

### Hindi aliases
- Currently populated for common medicines only
- Needs expansion with regional transliteration variants
- Consider adding Marathi, Tamil, Bengali aliases for broader coverage

---

## FastAPI Integration Notes

### Required pip packages
```
fastapi
uvicorn
pydantic
python-dotenv
rapidfuzz          # for fuzzy medicine name matching
```

### Key API endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/scan` | POST | Main safety check (OCR text + profile) |
| `/api/v1/medicines/search` | GET | Medicine name search |
| `/api/v1/interactions/{name}` | GET | Get interactions for a medicine |
| `/api/v1/alternatives/{brand}` | GET | Get cheaper alternatives |

### Overall Safety Status logic
- `SAFE` — no alerts found
- `CAUTION` — at least one caution-level alert (amber)
- `DANGER` — at least one dangerous interaction or caution-level contraindication
- `BLOCKED` — absolute contraindication, expired, allergy conflict, or dangerous interaction
- `UNKNOWN` — medicine not found in database

### Security notes
- This is a safety-information tool, NOT a prescription system
- Always append disclaimer: "This information is for guidance only. Consult a licensed doctor or pharmacist before taking any medicine."
- Never auto-suggest dose changes
- Log all BLOCKED responses for audit

---

## Source Trust Hierarchy

```
HIGHEST TRUST:   DailyMed, openFDA, CDSCO, PMBJP, WHO EML
HIGH TRUST:      Official package inserts / SmPC
MEDIUM TRUST:    Tata 1mg, PharmEasy, Netmeds (brand/price mapping only)
DO NOT USE:      Blogs, Quora, Reddit, AI-generated content
```

---

## Legal / Disclaimer

This data package is a research and development tool.
- All medical data must be verified by a qualified pharmacist or physician before production deployment
- Consult a regulatory expert before launching a health-related app in India (Telemedicine Guidelines 2020, CDSCO regulations)
- Medicine safety information changes; schedule quarterly reviews of all records
- Consider registering as a health app with DPDPA compliance requirements
