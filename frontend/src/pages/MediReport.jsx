// frontend/src/pages/MediReport.jsx
// Unified Personalized Medicine Report — Combines MediScan + MediInfo + Personalized Outcome

import React, { useState, useRef } from 'react'
import { useStore } from '../store/useStore'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || ''

// ─── Local medicine data (mirrors backend + frontend info page) ────────────────
const LOCAL_DB = {
  paracetamol: {
    generic_name: 'Paracetamol (Acetaminophen)',
    brand_names: ['Crocin', 'Dolo 650', 'Calpol', 'Metacin', 'P500'],
    category: 'Analgesic / Antipyretic',
    uses: ['Fever', 'Headache', 'Body pain', 'Toothache', 'Post-vaccination fever'],
    who_avoid: ['Severe liver disease patients', 'Chronic alcohol users', 'Those allergic to acetaminophen'],
    dosage: '500–1000mg every 4–6 hrs. Max 4g/day.',
    warnings: ['Do NOT exceed 4g/day — liver failure risk', 'Avoid alcohol', 'Check combo products for hidden paracetamol'],
    otc: true, danger_dengue: false,
    side_effects: ['Nausea (rare)', 'Skin rash (rare)', 'Liver damage on overdose'],
    contraindications: ['Severe liver disease', 'Regular alcohol consumption'],
  },
  ibuprofen: {
    generic_name: 'Ibuprofen',
    brand_names: ['Brufen 400', 'Combiflam', 'Ibugesic Plus', 'Advil 400'],
    category: 'NSAID / Anti-inflammatory',
    uses: ['Moderate pain', 'Fever when Paracetamol insufficient', 'Arthritis', 'Menstrual cramps', 'Muscle pain'],
    who_avoid: ['Dengue patients', 'Kidney disease patients', 'Stomach ulcer patients', 'Heart patients', 'Asthma patients', 'Children under 6 months'],
    dosage: '200–400mg every 4–6 hrs with food. Max 1200mg/day (OTC).',
    warnings: ['⛔ NEVER in dengue — platelet drop, bleeding risk', 'Take with food', 'Avoid in kidney disease'],
    otc: true, danger_dengue: true,
    side_effects: ['Stomach pain', 'Heartburn', 'Nausea', 'Bleeding risk'],
    contraindications: ['Dengue', 'Stomach ulcer', 'Kidney disease', 'Heart disease', 'Asthma'],
  },
  amoxicillin: {
    generic_name: 'Amoxicillin',
    brand_names: ['Amoxil', 'Novamox', 'Moxikind', 'Wymox'],
    category: 'Penicillin Antibiotic',
    uses: ['Bacterial throat infection', 'Ear infection', 'Urinary tract infection', 'Mild pneumonia'],
    who_avoid: ['Penicillin allergic patients', 'Mononucleosis patients', 'Without prescription'],
    dosage: '250–500mg every 8 hrs for 5–7 days. PRESCRIPTION REQUIRED.',
    warnings: ['PRESCRIPTION required', 'Penicillin allergy contraindication', 'Complete full course', 'Viral infections will NOT respond'],
    otc: false, danger_dengue: false,
    side_effects: ['Diarrhea', 'Nausea', 'Rash', 'Yeast infection'],
    contraindications: ['Penicillin allergy', 'Mononucleosis'],
  },
  metformin: {
    generic_name: 'Metformin',
    brand_names: ['Glycomet 500', 'Glucophage', 'Obimet', 'Bigomet'],
    category: 'Antidiabetic (Biguanide)',
    uses: ['Type 2 Diabetes — first-line treatment', 'PCOS (off-label)', 'Prediabetes'],
    who_avoid: ['Severe kidney disease patients', 'Liver disease patients', 'Heart failure patients', 'Without prescription'],
    dosage: 'Start 500mg twice daily with meals. Max 2000mg/day.',
    warnings: ['PRESCRIPTION required', 'Avoid alcohol — lactic acidosis risk', 'Stop before CT/MRI contrast', 'Check kidney function every 6 months'],
    otc: false, danger_dengue: false,
    side_effects: ['Nausea', 'Diarrhea', 'Stomach upset', 'Vitamin B12 deficiency'],
    contraindications: ['Severe kidney disease', 'Liver disease', 'Heart failure'],
  },
  cetirizine: {
    generic_name: 'Cetirizine',
    brand_names: ['Cetzine', 'Zyrtec', 'Alerid', 'Okacet'],
    category: 'Antihistamine (2nd generation)',
    uses: ['Allergic rhinitis (runny nose)', 'Urticaria (hives)', 'Allergic skin reactions', 'Hay fever', 'Itchy eyes'],
    who_avoid: ['Severe kidney disease patients', 'Breastfeeding mothers', 'Those who need to drive / operate machinery'],
    dosage: 'Adult: 10mg once daily at bedtime. Children 6–12yrs: 5mg daily.',
    warnings: ['Can cause drowsiness — avoid driving', 'Avoid alcohol', 'Reduce dose in kidney disease'],
    otc: true, danger_dengue: false,
    side_effects: ['Drowsiness', 'Dry mouth', 'Fatigue', 'Headache'],
    contraindications: ['Severe kidney disease', 'Breastfeeding'],
  },
  omeprazole: {
    generic_name: 'Omeprazole',
    brand_names: ['Omez', 'Prilosec', 'Omifan', 'Lopraz'],
    category: 'Proton Pump Inhibitor (PPI)',
    uses: ['Acid reflux / GERD', 'Peptic ulcer', 'H. pylori eradication (combo)', 'NSAID-induced ulcer prevention'],
    who_avoid: ['Clopidogrel users (use Pantoprazole instead)', 'Osteoporosis patients (long-term)', 'Without doctor advice beyond 8 weeks'],
    dosage: '20mg once daily before breakfast. For ulcers: 20–40mg for 4–8 weeks.',
    warnings: ['Take before meals', 'Long-term use may reduce B12/magnesium', '⚠️ Avoid if on Clopidogrel', 'Do not use > 8 weeks without doctor'],
    otc: false, danger_dengue: false,
    side_effects: ['Headache', 'Constipation', 'Nausea', 'Vitamin B12 deficiency'],
    contraindications: ['Liver disease', 'Osteoporosis (long-term)'],
  },
  aspirin: {
    generic_name: 'Aspirin',
    brand_names: ['Disprin', 'Ecosprin', 'Aspro'],
    category: 'NSAID & Antiplatelet',
    uses: ['Pain relief', 'Fever', 'Inflammation', 'Heart attack prevention (low dose)', 'Stroke prevention'],
    who_avoid: ['Dengue patients', 'Children under 18', 'Stomach ulcer patients', 'Bleeding disorder patients'],
    dosage: '300–600mg for pain. 75–150mg daily for heart.',
    warnings: ['⛔ NEVER in dengue', 'Do NOT give to children with fever (Reye syndrome risk)', 'Take with food'],
    otc: true, danger_dengue: true,
    side_effects: ['Stomach irritation', 'Bleeding', 'Ringing in ears'],
    contraindications: ['Dengue', 'Children with fever', 'Stomach ulcer'],
  },
}

const BRAND_ALIASES = {
  crocin: 'paracetamol', dolo: 'paracetamol', calpol: 'paracetamol', metacin: 'paracetamol',
  brufen: 'ibuprofen', combiflam: 'ibuprofen', ibugesic: 'ibuprofen', advil: 'ibuprofen',
  amoxil: 'amoxicillin', novamox: 'amoxicillin', moxikind: 'amoxicillin',
  glycomet: 'metformin', glucophage: 'metformin', obimet: 'metformin',
  cetzine: 'cetirizine', zyrtec: 'cetirizine', alerid: 'cetirizine', okacet: 'cetirizine',
  omez: 'omeprazole', prilosec: 'omeprazole', lopraz: 'omeprazole',
  disprin: 'aspirin', ecosprin: 'aspirin',
}

function findLocal(name) {
  const k = name.toLowerCase().trim()
  if (LOCAL_DB[k]) return { key: k, data: LOCAL_DB[k] }
  if (BRAND_ALIASES[k]) return { key: BRAND_ALIASES[k], data: LOCAL_DB[BRAND_ALIASES[k]] }
  for (const [key, data] of Object.entries(LOCAL_DB)) {
    if (data.generic_name.toLowerCase().includes(k)) return { key, data }
    if (data.brand_names.some(b => b.toLowerCase().includes(k))) return { key, data }
  }
  return null
}

// ─── Personalized outcome engine ───────────────────────────────────────────────
function computeOutcome(med, userConditions) {
  const conditions = userConditions.trim().toLowerCase()
  if (!conditions) return null

  const alerts = []
  const positives = []
  let verdict = 'safe' // safe | caution | avoid

  const has = (word) => conditions.includes(word)

  // ── Dengue ──────────────────────────────────
  if (med.danger_dengue && has('dengue')) {
    alerts.push({ level: 'critical', text: '🚨 CRITICAL: You have Dengue. This medicine can cause severe internal bleeding by dropping platelets. DO NOT TAKE.' })
    verdict = 'avoid'
  }

  // ── Liver ────────────────────────────────────
  if ((has('liver') || has('hepatitis') || has('cirrhosis')) && med.generic_name.toLowerCase().includes('paracetamol')) {
    alerts.push({ level: 'danger', text: '⚠️ Liver disease detected. Paracetamol max dose should be ≤2g/day. Consult doctor before use.' })
    if (verdict === 'safe') verdict = 'caution'
  }

  // ── Kidney ───────────────────────────────────
  if (has('kidney') || has('renal') || has('ckd')) {
    const gen = med.generic_name.toLowerCase()
    if (gen.includes('ibuprofen') || gen.includes('aspirin') || gen.includes('nsaid')) {
      alerts.push({ level: 'danger', text: '🚫 Kidney disease: NSAIDs (like this medicine) can seriously worsen kidney function. Avoid.' })
      if (verdict !== 'avoid') verdict = 'caution'
    }
    if (gen.includes('metformin')) {
      alerts.push({ level: 'danger', text: '🚫 Kidney disease: Metformin is contraindicated in severe kidney disease due to lactic acidosis risk.' })
      if (verdict !== 'avoid') verdict = 'caution'
    }
  }

  // ── Stomach ulcer ────────────────────────────
  if ((has('ulcer') || has('stomach') || has('gerd') || has('gastric')) && (med.generic_name.toLowerCase().includes('ibuprofen') || med.generic_name.toLowerCase().includes('aspirin'))) {
    alerts.push({ level: 'warning', text: '⚠️ Stomach/Ulcer issue detected. This NSAID can irritate stomach lining. Take with food or avoid.' })
    if (verdict === 'safe') verdict = 'caution'
  }

  // ── Penicillin allergy ───────────────────────
  if ((has('penicillin') || has('amoxicillin') || has('antibiotic allergy')) && med.generic_name.toLowerCase().includes('amoxicillin')) {
    alerts.push({ level: 'critical', text: '🚨 Penicillin/Antibiotic allergy detected. Amoxicillin can cause severe allergic reaction (anaphylaxis). DO NOT TAKE.' })
    verdict = 'avoid'
  }

  // ── Asthma ───────────────────────────────────
  if (has('asthma') && (med.generic_name.toLowerCase().includes('ibuprofen') || med.generic_name.toLowerCase().includes('aspirin'))) {
    alerts.push({ level: 'danger', text: '🚫 Asthma detected. NSAIDs can trigger asthma attacks in sensitive patients. Use with extreme caution.' })
    if (verdict !== 'avoid') verdict = 'caution'
  }

  // ── Diabetes ─────────────────────────────────
  if ((has('diabetes') || has('diabetic') || has('sugar')) && med.generic_name.toLowerCase().includes('metformin')) {
    positives.push('✅ Metformin is the first-line treatment for Type 2 Diabetes. It is suitable for your condition.')
  }

  // ── Allergy symptoms ─────────────────────────
  if ((has('allergy') || has('allergic') || has('hives') || has('runny nose') || has('hay fever')) && med.generic_name.toLowerCase().includes('cetirizine')) {
    positives.push('✅ Cetirizine is effective for your allergy symptoms. Suitable choice.')
  }

  // ── Acid / GERD ──────────────────────────────
  if ((has('acid') || has('heartburn') || has('gerd') || has('acidity')) && med.generic_name.toLowerCase().includes('omeprazole')) {
    positives.push('✅ Omeprazole directly treats your acid/GERD condition. Good match.')
  }

  // ── Fever / Headache ─────────────────────────
  if ((has('fever') || has('headache') || has('body pain') || has('pain')) && med.generic_name.toLowerCase().includes('paracetamol')) {
    positives.push('✅ Paracetamol is effective and generally safe for your fever/pain condition.')
  }

  // ── Heart disease ────────────────────────────
  if ((has('heart') || has('cardiac') || has('hypertension') || has('blood pressure')) && (med.generic_name.toLowerCase().includes('ibuprofen'))) {
    alerts.push({ level: 'warning', text: '⚠️ Heart/BP condition detected. Ibuprofen can raise blood pressure and increase cardiovascular risk. Prefer Paracetamol.' })
    if (verdict === 'safe') verdict = 'caution'
  }

  // ── Prescription check ───────────────────────
  if (!med.otc) {
    alerts.push({ level: 'info', text: '📋 This medicine requires a PRESCRIPTION. Please consult a doctor before taking.' })
  }

  // Build outcome verdict text
  let verdictText = ''
  let verdictColor = ''
  let verdictEmoji = ''
  if (verdict === 'safe') {
    verdictText = 'Generally SAFE for your conditions'
    verdictColor = '#059669'
    verdictEmoji = '✅'
  } else if (verdict === 'caution') {
    verdictText = 'Use with CAUTION — consult your doctor'
    verdictColor = '#d97706'
    verdictEmoji = '⚠️'
  } else {
    verdictText = 'AVOID — High risk based on your conditions'
    verdictColor = '#dc2626'
    verdictEmoji = '🚫'
  }

  return { alerts, positives, verdict, verdictText, verdictColor, verdictEmoji }
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function MediReport() {
  const { profile } = useStore()
  const isHindi = profile?.language === 'hi'
  const T = (en, hi) => isHindi ? hi : en

  // Step state: 1=search, 2=info, 3=check, 4=outcome
  const [step, setStep] = useState(1)
  const [medicineName, setMedicineName] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [medicine, setMedicine] = useState(null)  // { key, data }
  const [fromScan, setFromScan] = useState(false)
  const [ocrData, setOcrData] = useState(null)
  const [notFound, setNotFound] = useState(false)

  // Step 3 — user conditions
  const [userConditions, setUserConditions] = useState(() => {
    const parts = []
    if (profile?.diseases?.length) parts.push(...profile.diseases)
    if (profile?.allergies?.length) parts.push(...profile.allergies.map(a => `${a} allergy`))
    if (profile?.currentMedicines?.length) parts.push(...profile.currentMedicines.map(m => `taking ${m}`))
    return parts.join(', ')
  })

  const [outcome, setOutcome] = useState(null)
  const fileInputRef = useRef(null)

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const reset = () => {
    setStep(1); setMedicine(null); setNotFound(false)
    setSelectedImage(null); setFromScan(false); setOcrData(null)
    setOutcome(null); setMedicineName('')
  }

  const handleFound = (key, data, fromScanMode = false, ocr = null) => {
    setMedicine({ key, data })
    setFromScan(fromScanMode)
    setOcrData(ocr)
    setNotFound(false)
    setStep(2)
  }

  // ── Step 1A: Search by name ───────────────────────────────────────────────
  const searchByName = async (name = medicineName) => {
    if (!name.trim()) return
    setLoading(true); setNotFound(false)
    const local = findLocal(name)
    if (local) {
      setLoading(false)
      handleFound(local.key, local.data)
      return
    }
    try {
      const formData = new FormData()
      formData.append('medicine_name', name)
      if (profile) formData.append('user_profile', JSON.stringify(profile))
      const res = await axios.post(`${API_URL}/api/scanner/search-by-name`, formData)
      if (res.data.success) {
        handleFound(res.data.medicine_key, res.data.medicine_data)
      } else {
        setNotFound(true)
      }
    } catch (err) {
      if (err.response?.status === 404) setNotFound(true)
      else alert(T('Error searching medicine. Is backend running?', 'दवाई खोजने में त्रुटि। Backend चल रहा है?'))
    } finally {
      setLoading(false)
    }
  }

  // ── Step 1B: Scan image ───────────────────────────────────────────────────
  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setSelectedImage(URL.createObjectURL(file))
    setLoading(true); setNotFound(false)
    const formData = new FormData()
    formData.append('file', file)
    if (profile) formData.append('user_profile', JSON.stringify(profile))
    try {
      const res = await axios.post(`${API_URL}/api/scanner/scan-image`, formData, { timeout: 30000 })
      if (res.data.success && res.data.medicine_found) {
        const key = res.data.medicine_key
        const local = findLocal(key)
        const data = local ? local.data : res.data.medicine_data
        setMedicineName(key)
        handleFound(local ? local.key : key, data, true, res.data.ocr_extracted)
      } else {
        setNotFound(true)
        alert(T(`Could not detect: ${res.data.message || 'Try manual search'}`, `पहचान विफल: ${res.data.message || 'मैन्युअल खोजें'}`))
      }
    } catch (err) {
      if (err.code === 'ERR_NETWORK') alert(T('Backend not reachable on port 8000', 'Backend port 8000 पर नहीं चल रहा'))
      else alert(T('Scan error: ' + (err.response?.data?.detail || err.message), 'स्कैन त्रुटि: ' + (err.response?.data?.detail || err.message)))
    } finally {
      setLoading(false)
    }
  }

  // ── Step 3 → 4: Compute outcome ──────────────────────────────────────────
  const runPersonalizedCheck = () => {
    if (!userConditions.trim()) return
    const result = computeOutcome(medicine.data, userConditions)
    setOutcome(result)
    setStep(4)
  }

  const med = medicine?.data

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="page" style={{ paddingTop: 80 }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div className="badge badge-indigo">🧾 {T('Personalized Report', 'व्यक्तिगत रिपोर्ट')}</div>
          {step > 1 && (
            <button
              onClick={reset}
              style={{ fontSize: 12, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
            >
              ← {T('New Report', 'नई रिपोर्ट')}
            </button>
          )}
        </div>
        <h1 className="section-title">{T('Medicine Report', 'दवाई रिपोर्ट')}</h1>
        <p style={{ color: '#64748b', fontSize: 15, maxWidth: 620, lineHeight: 1.6 }}>
          {T(
            'Search or scan any medicine → get full info → check safety for YOUR conditions → see personalized outcome.',
            'दवाई का नाम डालें या स्कैन करें → पूरी जानकारी देखें → अपनी स्थिति जाँचें → व्यक्तिगत परिणाम देखें।'
          )}
        </p>
      </div>

      {/* ── STEPPER ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 40, flexWrap: 'wrap' }}>
        {[
          { n: 1, label: T('Find Medicine', 'दवाई खोजें') },
          { n: 2, label: T('Medicine Info', 'दवाई जानकारी') },
          { n: 3, label: T('Your Conditions', 'आपकी स्थिति') },
          { n: 4, label: T('Outcome', 'परिणाम') },
        ].map(({ n, label }) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 900,
              background: step === n ? '#6366f1' : step > n ? '#059669' : '#e2e8f0',
              color: step >= n ? '#fff' : '#94a3b8',
              transition: 'all 0.3s',
            }}>{step > n ? '✓' : n}</div>
            <span style={{ fontSize: 12, fontWeight: 700, color: step === n ? '#6366f1' : step > n ? '#059669' : '#94a3b8' }}>
              {label}
            </span>
            {n < 4 && <div style={{ width: 24, height: 2, background: step > n ? '#059669' : '#e2e8f0', borderRadius: 2 }} />}
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          STEP 1 — FIND MEDICINE
      ═══════════════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <div className="animate-fade">
          {/* Scan Panel */}
          <div className="card-premium" style={{
            marginBottom: 32, padding: 0, overflow: 'hidden',
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
            border: 'none', boxShadow: '0 20px 40px rgba(30,27,75,0.25)'
          }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: 'linear-gradient(90deg, transparent, #818cf8, transparent)',
                animation: 'scan 3s ease-in-out infinite'
              }} />
            </div>
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div style={{
                width: 72, height: 72, borderRadius: 20, background: 'rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36, margin: '0 auto 20px', backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
              }}>📸</div>
              <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 900, marginBottom: 8 }}>
                {T('Scan Medicine Strip', 'दवाई की पट्टी स्कैन करें')}
              </h3>
              <p style={{ color: '#c7d2fe', fontSize: 13, marginBottom: 28, opacity: 0.85 }}>
                {T('Take a clear photo of the medicine packaging. AI will auto-detect the name.', 'दवाई की पैकेजिंग की स्पष्ट फोटो लें। AI स्वतः नाम पहचान लेगा।')}
              </p>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageUpload} style={{ display: 'none' }} />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                style={{
                  width: '100%', maxWidth: 280, height: 52,
                  background: '#fff', color: '#312e81', fontWeight: 800,
                  fontSize: 14, borderRadius: 14, border: 'none', cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.15)', letterSpacing: '0.02em'
                }}
              >
                {loading ? (T('🔍 Analyzing...', '🔍 विश्लेषण हो रहा है...')) : T('📷 Scan / Upload Image', '📷 स्कैन / फोटो अपलोड करें')}
              </button>
            </div>
            {selectedImage && (
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: 20, textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <img src={selectedImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 12 }} />
              </div>
            )}
          </div>

          {/* OR divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            <div style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>{T('OR', 'अथवा')}</div>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          </div>

          {/* Manual search */}
          <div className="card-premium" style={{ padding: 32 }}>
            <div className="lbl" style={{ marginBottom: 12 }}>{T('Search by Name', 'नाम से खोजें')}</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                id="medi-report-search"
                className="inp"
                value={medicineName}
                onChange={e => setMedicineName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchByName()}
                placeholder={T('e.g., Crocin, Brufen, Dolo 650, Amoxicillin...', 'जैसे, क्रोसिन, ब्रुफेन, डोलो 650, एमोक्सिसिलिन...')}
                disabled={loading}
                style={{ height: 52, borderRadius: 12, flex: 1 }}
              />
              <button
                id="medi-report-search-btn"
                className="btn btn-primary"
                onClick={() => searchByName()}
                disabled={loading}
                style={{ width: 56, height: 52, padding: 0, borderRadius: 12, fontSize: 18 }}
              >
                {loading ? '⏳' : '🔍'}
              </button>
            </div>

            {/* Quick pills */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10 }}>
                {T('Quick Select:', 'त्वरित चुनें:')}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Crocin', 'Dolo 650', 'Brufen', 'Omez', 'Glycomet', 'Cetirizine', 'Aspirin'].map(m => (
                  <button
                    key={m}
                    onClick={() => { setMedicineName(m); searchByName(m) }}
                    className="chip"
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 13 }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {notFound && (
              <div className="alert alert-warn animate-fade" style={{ marginTop: 20, background: '#fffbeb' }}>
                🤔 {T(`"${medicineName}" not found. Try generic name or different spelling.`, `"${medicineName}" नहीं मिला। जेनेरिक नाम या अलग स्पेलिंग से खोजें।`)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          STEP 2 — MEDICINE INFO
      ═══════════════════════════════════════════════════════════════════ */}
      {step === 2 && med && (
        <div className="animate-fade">
          {/* Header card */}
          <div className="card-premium" style={{ padding: 0, overflow: 'hidden', marginBottom: 24, borderTop: '5px solid #6366f1' }}>
            <div style={{ padding: '28px 32px', background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                  {fromScan ? T('📸 Scanned Result', '📸 स्कैन परिणाम') : T('🔍 Search Result', '🔍 खोज परिणाम')}
                </div>
                <h2 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                  {med.generic_name}
                </h2>
                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginTop: 4 }}>
                  {(med.brand_names || []).join(' • ')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <div className={`badge ${med.otc ? 'badge-emerald' : 'badge-amber'}`}>
                  {med.otc ? 'OTC' : 'PRESCRIPTION REQUIRED'}
                </div>
                <div className="badge badge-indigo">{med.category}</div>
              </div>
            </div>

            <div style={{ padding: 32, display: 'grid', gap: 20 }}>
              {/* Uses */}
              <div>
                <div className="lbl" style={{ color: '#059669', marginBottom: 10 }}>
                  💊 {T('Uses (Kab lena chahiye)', 'उपयोग (कब लेना चाहिए)')}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(med.uses || []).map((u, i) => (
                    <div key={i} className="chip" style={{ background: '#f0fdf4', border: '1px solid #d1fae5', color: '#064e3b', fontWeight: 700 }}>
                      ✓ {u}
                    </div>
                  ))}
                </div>
              </div>

              {/* Who should avoid */}
              <div>
                <div className="lbl" style={{ color: '#dc2626', marginBottom: 10 }}>
                  🚫 {T('Who Should AVOID (Kisko nahi lena)', 'कौन नहीं ले (किसे नहीं लेना चाहिए)')}
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {(med.who_avoid || med.contraindications || []).map((c, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#991b1b', fontWeight: 600 }}>
                      <span style={{ color: '#ef4444', fontWeight: 900 }}>✗</span> {c}
                    </div>
                  ))}
                </div>
              </div>

              {/* Dosage + Warnings */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: 16 }}>
                <div style={{ background: '#f0fdf4', padding: 20, borderRadius: 16, border: '1px solid #d1fae5' }}>
                  <div className="lbl" style={{ color: '#059669', marginBottom: 8 }}>⚖️ {T('Dosage', 'खुराक')}</div>
                  <div style={{ fontSize: 14, color: '#064e3b', fontWeight: 700, lineHeight: 1.6 }}>{med.dosage}</div>
                </div>
                <div style={{ background: '#fff1f2', padding: 20, borderRadius: 16, border: '1px solid #fecaca' }}>
                  <div className="lbl" style={{ color: '#e11d48', marginBottom: 8 }}>⚠️ {T('Warnings', 'चेतावनी')}</div>
                  <div style={{ display: 'grid', gap: 6 }}>
                    {(med.warnings || []).map((w, i) => (
                      <div key={i} style={{ fontSize: 12, color: '#9f1239', fontWeight: 600, lineHeight: 1.4 }}>• {w}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* OCR Metadata if scanned */}
              {fromScan && ocrData && Object.keys(ocrData).length > 0 && (
                <div style={{ background: '#eff6ff', padding: 20, borderRadius: 16, border: '1px solid #bfdbfe' }}>
                  <div className="lbl" style={{ color: '#2563eb', marginBottom: 10 }}>📋 {T('Scanned Details', 'स्कैन विवरण')}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                    {ocrData.expiry_date && <div><div style={{ fontSize: 10, color: '#1d4ed8', fontWeight: 800 }}>EXPIRY</div><div style={{ fontSize: 14, fontWeight: 900, color: '#1e3a8a' }}>{ocrData.expiry_date}</div></div>}
                    {ocrData.batch_number && <div><div style={{ fontSize: 10, color: '#1d4ed8', fontWeight: 800 }}>BATCH</div><div style={{ fontSize: 14, fontWeight: 900, color: '#1e3a8a' }}>{ocrData.batch_number}</div></div>}
                    {ocrData.mrp && <div><div style={{ fontSize: 10, color: '#1d4ed8', fontWeight: 800 }}>MRP</div><div style={{ fontSize: 14, fontWeight: 900, color: '#1e3a8a' }}>{ocrData.mrp}</div></div>}
                    {ocrData.manufacturer && <div><div style={{ fontSize: 10, color: '#1d4ed8', fontWeight: 800 }}>MFG</div><div style={{ fontSize: 13, fontWeight: 700, color: '#1e3a8a' }}>{ocrData.manufacturer}</div></div>}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            id="medi-report-check-btn"
            className="btn btn-primary"
            onClick={() => setStep(3)}
            style={{ width: '100%', height: 54, borderRadius: 14, fontSize: 15, fontWeight: 900, letterSpacing: '0.02em' }}
          >
            🎯 {T('Check For ME → (Personalized Safety)', 'मेरे लिए जाँचें → (व्यक्तिगत सुरक्षा)')}
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          STEP 3 — USER CONDITIONS INPUT
      ═══════════════════════════════════════════════════════════════════ */}
      {step === 3 && (
        <div className="animate-fade">
          <div className="card-premium" style={{ padding: 36, marginBottom: 24, borderTop: '5px solid #f59e0b' }}>
            <div style={{ display: 'flex', gap: 16, marginBottom: 28, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 40 }}>🩺</div>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 6 }}>
                  {T('Enter Your Health Conditions', 'अपनी स्वास्थ्य स्थिति दर्ज करें')}
                </h2>
                <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>
                  {T(
                    'Describe your current diseases, allergies, or medications. We will compute the safety outcome for this specific medicine.',
                    'अपनी बीमारियाँ, एलर्जी, या दवाइयाँ बताएं। हम इस दवाई की सुरक्षा आपके लिए जाँचेंगे।'
                  )}
                </p>
              </div>
            </div>

            {/* Pre-filled from profile */}
            {profile?.diseases?.length > 0 && (
              <div style={{ marginBottom: 16, padding: 14, background: '#f0fdf4', borderRadius: 12, border: '1px solid #d1fae5', fontSize: 13, color: '#065f46', fontWeight: 600 }}>
                👤 {T('From your profile:', 'आपके प्रोफाइल से:')} {profile.diseases.join(', ')}
                {profile.allergies?.length ? ` | Allergies: ${profile.allergies.join(', ')}` : ''}
              </div>
            )}

            <div className="lbl" style={{ marginBottom: 10 }}>
              {T('Your conditions, allergies, diseases:', 'आपकी स्थिति, एलर्जी, बीमारियाँ:')}
            </div>
            <textarea
              id="medi-report-conditions"
              value={userConditions}
              onChange={e => setUserConditions(e.target.value)}
              placeholder={T(
                'e.g., diabetes, kidney disease, dengue, penicillin allergy, heart disease, asthma, pregnancy, liver disease...',
                'जैसे, मधुमेह, किडनी रोग, डेंगू, पेनिसिलिन एलर्जी, हृदय रोग, अस्थमा, गर्भावस्था, लीवर रोग...'
              )}
              rows={5}
              style={{
                width: '100%', borderRadius: 14, border: '2px solid #e2e8f0',
                padding: 16, fontSize: 14, fontFamily: 'inherit', resize: 'vertical',
                outline: 'none', lineHeight: 1.6, color: '#1e293b', fontWeight: 500,
                boxSizing: 'border-box', transition: 'border 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />

            {/* Quick condition chips */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.05em' }}>
                {T('Quick Add:', 'त्वरित जोड़ें:')}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Diabetes', 'Dengue', 'Kidney disease', 'Liver disease', 'Heart disease', 'Asthma', 'Penicillin allergy', 'Stomach ulcer', 'Pregnancy', 'Hypertension'].map(c => (
                  <button
                    key={c}
                    onClick={() => {
                      const cur = userConditions.trim()
                      setUserConditions(cur ? `${cur}, ${c}` : c)
                    }}
                    className="chip"
                    style={{ fontSize: 12, background: '#fafafa', border: '1px solid #e2e8f0' }}
                  >
                    + {c}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 28, display: 'flex', gap: 12 }}>
              <button
                onClick={() => setStep(2)}
                style={{
                  flex: 1, height: 52, borderRadius: 14, border: '2px solid #e2e8f0',
                  background: '#fff', color: '#475569', fontWeight: 700, cursor: 'pointer', fontSize: 14
                }}
              >
                ← {T('Back', 'वापस')}
              </button>
              <button
                id="medi-report-outcome-btn"
                className="btn btn-primary"
                onClick={runPersonalizedCheck}
                disabled={!userConditions.trim()}
                style={{ flex: 2, height: 52, borderRadius: 14, fontSize: 15, fontWeight: 900 }}
              >
                🔬 {T('Generate My Report', 'मेरी रिपोर्ट बनाएं')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          STEP 4 — PERSONALIZED OUTCOME
      ═══════════════════════════════════════════════════════════════════ */}
      {step === 4 && outcome && med && (
        <div className="animate-fade">
          {/* Verdict Banner */}
          <div style={{
            marginBottom: 28, padding: '28px 32px', borderRadius: 20,
            background: outcome.verdict === 'safe' ? 'linear-gradient(135deg, #ecfdf5, #d1fae5)' :
                        outcome.verdict === 'caution' ? 'linear-gradient(135deg, #fffbeb, #fef3c7)' :
                        'linear-gradient(135deg, #fef2f2, #fee2e2)',
            border: `2px solid ${outcome.verdictColor}30`,
            boxShadow: `0 8px 24px ${outcome.verdictColor}20`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 48 }}>{outcome.verdictEmoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: outcome.verdictColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                  {T('Personalized Verdict for', 'व्यक्तिगत निर्णय:')} {profile?.name || T('You', 'आप')}
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: outcome.verdictColor, marginBottom: 4 }}>
                  {outcome.verdictText}
                </div>
                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                  {T('Based on:', 'आधार:')} {userConditions}
                </div>
              </div>
              <div style={{
                padding: '8px 20px', borderRadius: 50, fontWeight: 900, fontSize: 13,
                background: outcome.verdictColor, color: '#fff',
                boxShadow: `0 4px 12px ${outcome.verdictColor}40`
              }}>
                {med.generic_name}
              </div>
            </div>
          </div>

          {/* Alerts */}
          {outcome.alerts.length > 0 && (
            <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
              {outcome.alerts.map((alert, i) => (
                <div key={i} style={{
                  padding: '16px 20px', borderRadius: 14, fontSize: 14, fontWeight: 600, lineHeight: 1.6,
                  background: alert.level === 'critical' ? '#fef2f2' :
                               alert.level === 'danger' ? '#fff7ed' :
                               alert.level === 'warning' ? '#fffbeb' : '#eff6ff',
                  borderLeft: `5px solid ${alert.level === 'critical' ? '#dc2626' : alert.level === 'danger' ? '#ea580c' : alert.level === 'warning' ? '#d97706' : '#3b82f6'}`,
                  color: alert.level === 'critical' ? '#991b1b' : alert.level === 'danger' ? '#9a3412' : alert.level === 'warning' ? '#92400e' : '#1e3a8a',
                }}>
                  {alert.text}
                </div>
              ))}
            </div>
          )}

          {/* Positives */}
          {outcome.positives.length > 0 && (
            <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
              {outcome.positives.map((pos, i) => (
                <div key={i} style={{
                  padding: '16px 20px', borderRadius: 14, fontSize: 14, fontWeight: 600, lineHeight: 1.6,
                  background: '#f0fdf4', borderLeft: '5px solid #059669', color: '#065f46'
                }}>
                  {pos}
                </div>
              ))}
            </div>
          )}

          {/* Summary Card */}
          <div className="card-premium" style={{ padding: 28, marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
              📊 {T('Report Summary', 'रिपोर्ट सारांश')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 14 }}>
              {[
                { label: T('Medicine', 'दवाई'), value: med.generic_name.split(' ')[0], color: '#6366f1' },
                { label: T('Category', 'वर्ग'), value: med.category, color: '#0891b2' },
                { label: T('OTC Status', 'OTC स्थिति'), value: med.otc ? T('Over Counter', 'बिना Rx') : T('Prescription', 'Rx जरूरी'), color: med.otc ? '#059669' : '#d97706' },
                { label: T('Dengue Safe', 'डेंगू सुरक्षित'), value: med.danger_dengue ? T('❌ No', '❌ नहीं') : T('✅ Yes', '✅ हाँ'), color: med.danger_dengue ? '#dc2626' : '#059669' },
                { label: T('Risk Level', 'जोखिम स्तर'), value: outcome.verdict.toUpperCase(), color: outcome.verdictColor },
                { label: T('alerts', 'चेतावनी'), value: `${outcome.alerts.length} ${T('alert(s)', 'चेतावनी')}`, color: outcome.alerts.length > 0 ? '#dc2626' : '#059669' },
              ].map((s, i) => (
                <div key={i} style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: s.color, lineHeight: 1.3 }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{ padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 32 }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, lineHeight: 1.6 }}>
              ⚕️ <strong style={{ color: '#64748b' }}>{T('Disclaimer:', 'अस्वीकरण:')}</strong>{' '}
              {T(
                'This report is AI-generated for informational purposes only. Always consult a qualified doctor before starting, changing, or stopping any medication.',
                'यह रिपोर्ट केवल सूचनात्मक उद्देश्यों के लिए AI द्वारा तैयार की गई है। कोई भी दवाई शुरू करने, बदलने या बंद करने से पहले हमेशा एक योग्य डॉक्टर से परामर्श करें।'
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => { setStep(3); setOutcome(null) }}
              style={{
                flex: 1, minWidth: 140, height: 50, borderRadius: 14,
                border: '2px solid #e2e8f0', background: '#fff',
                color: '#475569', fontWeight: 700, cursor: 'pointer', fontSize: 14
              }}
            >
              ✏️ {T('Edit Conditions', 'स्थिति बदलें')}
            </button>
            <button
              onClick={reset}
              className="btn btn-primary"
              style={{ flex: 1, minWidth: 140, height: 50, borderRadius: 14, fontSize: 14, fontWeight: 800 }}
            >
              🔄 {T('New Medicine Report', 'नई दवाई रिपोर्ट')}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scan {
          0%, 100% { top: 0%; opacity: 0; }
          50% { top: 100%; opacity: 1; }
        }
      `}</style>
    </div>
  )
}
