import React, { useState } from 'react'
import { useStore } from '../store/useStore'
import axios from 'axios'

// Verified data: WHO EML 2023, IP 2022, NPPA, OpenFDA
const MEDICINES = {
  paracetamol: {
    name: 'Paracetamol (Acetaminophen)',
    brands: 'Crocin 500, Dolo 650, Calpol, Metacin, P500',
    category: 'Analgesic / Antipyretic',
    uses: ['Fever','Headache','Body ache','Dental pain','Post-vaccination fever'],
    uses_hi: ['बुखार','सिरदर्द','शरीर दर्द','दांत दर्द','टीके के बाद बुखार'],
    dose: 'Adult: 500–1000mg every 4–6 hrs. Max: 4g/day',
    dose_hi: 'वयस्क: 500–1000mg हर 4–6 घंटे। अधिकतम: 4g/दिन',
    warnings: ['Do NOT exceed 4g/day — liver failure risk','Avoid alcohol','Check all combo products for hidden paracetamol'],
    warnings_hi: ['4g/दिन से ज्यादा नहीं — लीवर फेलियर का खतरा','शराब से बचें','Combiflam जैसी combo दवाइयों में छुपा paracetamol देखें'],
    price_branded: 22, price_generic: 8, price_jan: 7,
    who_essential: true, otc: true,
    dengue_safe: true,
    sources: ['WHO EML 2023','IP 2022','NPPA Price List'],
  },
  ibuprofen: {
    name: 'Ibuprofen',
    brands: 'Brufen 400, Combiflam, Ibugesic Plus, Advil 400',
    category: 'NSAID / Anti-inflammatory',
    uses: ['Moderate pain','Fever (when Paracetamol insufficient)','Arthritis','Menstrual cramps'],
    uses_hi: ['मध्यम दर्द','बुखार (जब Paracetamol काम न करे)','गठिया','मासिक दर्द'],
    dose: 'Adult: 200–400mg every 4–6 hrs with food. Max: 1200mg/day (OTC)',
    dose_hi: 'वयस्क: खाने के साथ 200–400mg हर 4–6 घंटे। अधिकतम: 1200mg/दिन',
    warnings: ['⛔ NEVER in dengue — platelet drop, bleeding risk','Take with food to avoid stomach upset','Avoid in kidney disease','Not for children under 6 months'],
    warnings_hi: ['⛔ डेंगू में कभी नहीं — platelet कम होने का खतरा','पेट खराबी से बचने के लिए खाने के साथ लें','किडनी रोग में नहीं','6 महीने से कम बच्चों को नहीं'],
    price_branded: 45, price_generic: 15, price_jan: 12,
    who_essential: true, otc: true,
    dengue_safe: false,
    sources: ['WHO EML 2023','IP 2022','FDA Label'],
  },
  amoxicillin: {
    name: 'Amoxicillin',
    brands: 'Amoxil, Novamox, Moxikind, Wymox',
    category: 'Penicillin Antibiotic',
    uses: ['Bacterial throat infection','Ear infection','Urinary tract infection','Pneumonia (mild)'],
    uses_hi: ['बैक्टीरियल गले का संक्रमण','कान का संक्रमण','मूत्र मार्ग संक्रमण','निमोनिया (हल्का)'],
    dose: 'Adult: 250–500mg every 8 hrs for 5–7 days. PRESCRIPTION REQUIRED.',
    dose_hi: 'वयस्क: हर 8 घंटे में 250–500mg, 5–7 दिन। प्रिस्क्रिप्शन जरूरी है।',
    warnings: ['⚠️ PRESCRIPTION required — do not self-medicate','Penicillin allergy contraindication','Complete full course even if feeling better','Viral infections (cold/flu) will NOT respond'],
    warnings_hi: ['⚠️ प्रिस्क्रिप्शन जरूरी — खुद से मत लो','पेनिसिलिन एलर्जी में नहीं','पूरा कोर्स करें भले ही बेहतर लगे','वायरल संक्रमण (सर्दी/फ्लू) में काम नहीं करता'],
    price_branded: 85, price_generic: 30, price_jan: 22,
    who_essential: true, otc: false,
    dengue_safe: true,
    sources: ['WHO EML 2023','IP 2022'],
  },
  metformin: {
    name: 'Metformin',
    brands: 'Glycomet 500, Glucophage, Obimet, Bigomet',
    category: 'Antidiabetic (Biguanide)',
    uses: ['Type 2 Diabetes — first-line treatment','PCOS (off-label)'],
    uses_hi: ['टाइप 2 मधुमेह — पहली पंक्ति की दवा','PCOS (off-label)'],
    dose: 'Start: 500mg twice daily with meals. Max: 2000mg/day. Always with food.',
    dose_hi: 'शुरुआत: खाने के साथ दिन में दो बार 500mg। अधिकतम: 2000mg/दिन। हमेशा खाने के साथ।',
    warnings: ['PRESCRIPTION required','Avoid alcohol — lactic acidosis risk','Stop before CT/MRI contrast dye','Check kidney function every 6 months'],
    warnings_hi: ['प्रिस्क्रिप्शन जरूरी','शराब से बचें — lactic acidosis का खतरा','CT/MRI से पहले बंद करें','हर 6 महीने किडनी जांच करवाएं'],
    price_branded: 65, price_generic: 20, price_jan: 14,
    who_essential: true, otc: false,
    dengue_safe: true,
    sources: ['WHO EML 2023','IP 2022','NPPA'],
  },
  cetirizine: {
    name: 'Cetirizine',
    brands: 'Cetzine, Zyrtec, Alerid, Okacet',
    category: 'Antihistamine (2nd generation)',
    uses: ['Allergic rhinitis (runny nose)','Urticaria (hives)','Allergic skin reactions','Hay fever'],
    uses_hi: ['एलर्जिक राइनाइटिस (नाक बहना)','पित्ती (urticaria)','एलर्जिक त्वचा प्रतिक्रियाएं','हे फीवर'],
    dose: 'Adult: 10mg once daily at bedtime. Children 6-12yrs: 5mg daily.',
    dose_hi: 'वयस्क: रात को 10mg एक बार। बच्चे 6-12 साल: 5mg प्रतिदिन।',
    warnings: ['Can cause drowsiness — avoid driving','Avoid alcohol','Reduce dose in kidney disease','Safe in pregnancy (B category)'],
    warnings_hi: ['नींद आ सकती है — गाड़ी न चलाएं','शराब से बचें','किडनी रोग में कम खुराक','गर्भावस्था में सुरक्षित (B category)'],
    price_branded: 35, price_generic: 8, price_jan: 5,
    who_essential: false, otc: true,
    dengue_safe: true,
    sources: ['IP 2022','FDA Label','BNF 2024'],
  },
  omeprazole: {
    name: 'Omeprazole',
    brands: 'Omez, Prilosec, Omifan, Lopraz',
    category: 'Proton Pump Inhibitor (PPI)',
    uses: ['Acid reflux / GERD','Peptic ulcer','H. pylori eradication (combo)','Prevention of NSAID-induced ulcers'],
    uses_hi: ['एसिड रिफ्लक्स / GERD','पेप्टिक अल्सर','H. pylori संक्रमण','NSAID-induced अल्सर की रोकथाम'],
    dose: 'Adult: 20mg once daily before breakfast. For ulcers: 20-40mg daily for 4-8 weeks.',
    dose_hi: 'वयस्क: नाश्ते से पहले 20mg एक बार। अल्सर के लिए: 4-8 हफ्ते तक 20-40mg।',
    warnings: ['Take before meals for best effect','Long-term use may reduce B12/magnesium','⚠️ Avoid if on Clopidogrel — use Pantoprazole instead','Do not use >8 weeks without doctor advice'],
    warnings_hi: ['खाने से पहले लें','लंबे समय तक उपयोग से B12/मैग्नीशियम कम हो सकता है','⚠️ Clopidogrel के साथ नहीं — Pantoprazole लें','डॉक्टर की सलाह के बिना 8 हफ्ते से ज्यादा नहीं'],
    price_branded: 55, price_generic: 18, price_jan: 12,
    who_essential: true, otc: false,
    dengue_safe: true,
    sources: ['WHO EML 2023','IP 2022'],
  },
}

const SEARCH_TERMS_HI = {
  'पेरासिटामोल': 'paracetamol','क्रोसिन': 'paracetamol','डोलो': 'paracetamol',
  'इबुप्रोफेन': 'ibuprofen','ब्रुफेन': 'ibuprofen',
  'एमोक्सिसिलिन': 'amoxicillin','मेटफॉर्मिन': 'metformin',
  'सेटिरिज़िन': 'cetirizine','ओमेप्राज़ोल': 'omeprazole',
}

export default function MedicineInfo() {
  const { profile, setActivePage } = useStore()

  const isHindi = profile.language === 'hi'
  const [query, setQuery] = useState('')
  const [medicine, setMedicine] = useState(null)
  const [notFound, setNotFound] = useState(false)

  const T = (en, hi) => isHindi ? hi : en

  const search = (q = query) => {
    if (!q.trim()) return
    const key = q.trim().toLowerCase()
    // Direct match or alias
    const found = MEDICINES[key]
      || Object.entries(MEDICINES).find(([k,v]) => v.name.toLowerCase().includes(key) || v.brands.toLowerCase().includes(key))?.[1]
      || (SEARCH_TERMS_HI[key] && MEDICINES[SEARCH_TERMS_HI[key]])
    if (found) { setMedicine(found); setNotFound(false) }
    else { setMedicine(null); setNotFound(true) }
  }

  const savings = medicine ? Math.round(((medicine.price_branded - medicine.price_jan) / medicine.price_branded) * 100) : 0

  return (
    <div className="page" style={{ paddingTop: 80 }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div className="badge badge-indigo">
            {isHindi ? "📑 क्लिनिकल इंडेक्स" : "📑 Clinical Inventory"}
          </div>
        </div>
        <h1 className="section-title">
          {isHindi ? 'दवाई डेटाबेस' : 'Medical Dictionary'}
        </h1>
        <p style={{ color: '#64748b', fontSize: 16, maxWidth: 600, lineHeight: 1.5 }}>
          {isHindi 
            ? 'WHO, IP और NPPA प्रमाणित डेटा के आधार पर दवाओं की वैज्ञानिक जानकारी।' 
            : 'Access high-fidelity pharmacological data cross-referenced with WHO Essential Medicine Lists and National Pricing Authorities.'}
        </p>
      </div>

      {/* Modern Search HUD */}
      <div className="card-premium" style={{ marginBottom: 40, padding: 32 }}>
        <div className="lbl" style={{ marginBottom: 12 }}>{T('Interrogate Database', 'डेटाबेस खोजें')}</div>
        <div style={{ position: 'relative' }}>
          <input
            className="inp"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder={isHindi ? 'दवाई या ब्रांड का नाम...' : 'Search molecules or brands (e.g. Crocin, Dolo)...'}
            style={{ 
              height: 60, paddingLeft: 24, paddingRight: 120, borderRadius: 16, 
              border: '2px solid #e2e8f0', background: '#fff', fontSize: 16, fontWeight: 600 
            }}
          />
          <button 
            className="btn btn-primary" 
            onClick={() => search()} 
            style={{ 
              position: 'absolute', right: 8, top: 8, height: 44, 
              borderRadius: 12, padding: '0 24px', fontWeight: 900 
            }}
          >
            {isHindi ? 'सर्च' : 'SEARCH'}
          </button>
        </div>

        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 16, letterSpacing: '0.05em' }}> {T('Clinical Benchmarks:', 'क्लीनिकल बेंचमार्क:') } </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap: 8 }}>
            {Object.keys(MEDICINES).map(k => (
              <button
                key={k}
                onClick={() => { setQuery(k); search(k) }}
                className="chip"
                style={{ 
                  padding: '10px 18px', fontSize: 13, 
                  background: medicine?.name.toLowerCase().includes(k) ? '#f1f5f9' : '#fff',
                  borderColor: medicine?.name.toLowerCase().includes(k) ? '#6366f1' : '#e2e8f0'
                }}
              >
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {notFound && (
        <div className="alert alert-danger animate-fade" style={{ marginBottom: 40 }}>
          <strong>⚠️ {T("UNRECOGNIZED AGENT", "दवा नहीं मिली")}</strong>: {isHindi
            ? `"${query}" वर्तमान डेटाबेस में अनुक्रमित नहीं है।`
            : `"${query}" is not indexed in our current clinical repository.`}
        </div>
      )}

      {medicine && (
        <div className="animate-fade">
          {/* Risk Mitigation Banners */}
          <div style={{ display: 'grid', gap: 12, marginBottom: 32 }}>
            {!medicine.dengue_safe && (
              <div className="card-premium" style={{ 
                background: '#fef2f2', border: '1px solid #fee2e2', 
                borderLeft: '6px solid #ef4444', padding: '16px 20px' 
              }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                   <div style={{ fontSize: 24 }}>🛑</div>
                   <div>
                      <div style={{ fontWeight: 900, color: '#991b1b', fontSize: 14 }}>{T('DENGUE CONTRAINDICATION', 'डेंगू निषेध')}</div>
                      <div style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>{T('Severe bleeding risk. Do not use if platelets are compromised.', 'गंभीर रक्तस्राव का खतरा। डेंगू में उपयोग न करें।')}</div>
                   </div>
                </div>
              </div>
            )}
            
            {profile?.diseases?.some(d => d.toLowerCase().includes('dengue')) && !medicine.dengue_safe && (
              <div className="alert alert-danger" style={{ animation: 'pulse 2s infinite' }}>
                🚨 {isHindi ? `इमरजेंसी: आपके प्रोफाइल में डेंगू है — यह दवा आपके लिए घातक है!` : `CRITICAL: Active Dengue profile detected. This agent is LETHAL in current context.`}
              </div>
            )}
            
            {profile?.allergies?.some(a => a.toLowerCase().includes('penicillin')) && medicine.name.toLowerCase().includes('amoxicillin') && (
               <div className="alert alert-danger">
                 ⚠️ {isHindi ? 'एलर्जी चेतावनी: पेनिसिलिन एलर्जी में प्रतिबंधित!' : 'ALLERGY ALERT: Use is strictly contraindicated based on Penicillin history.'}
               </div>
            )}
          </div>

          {/* Primary Intelligence HUD */}
          <div className="card-premium" style={{ padding: 0, overflow: 'hidden', marginBottom: 32, border: '1px solid #e2e8f0' }}>
             <div style={{ padding: 32, borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                   <div style={{ fontSize: 11, fontWeight: 900, color: '#6366f1', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.1em' }}>Pharmacological Monograph</div>
                   <h2 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>{medicine.name}</h2>
                   <div style={{ fontSize: 14, color: '#64748b', fontWeight: 600, marginTop: 4 }}>{T('Market Equivalents:', 'बाजार समकक्ष:')} {medicine.brands}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                   {medicine.who_essential && <div className="badge badge-indigo" style={{ padding: '6px 12px' }}>WHO EML ELIGIBLE</div>}
                   <div className={`badge ${medicine.otc ? 'badge-emerald' : 'badge-amber'}`} style={{ padding: '6px 12px' }}>
                      {medicine.otc ? 'OTC CLASSIFIED' : 'PRESCRIPTION MANDATORY'}
                   </div>
                </div>
             </div>

             <div style={{ padding: 32 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 32, marginBottom: 40 }}>
                   <div>
                      <div className="lbl" style={{ marginBottom: 12 }}>{T('THERAPEUTIC CLASS', 'चिकित्सा वर्ग')}</div>
                      <div style={{ fontWeight: 900, color: '#334155', fontSize: 16 }}>{medicine.category}</div>
                   </div>
                   <div>
                      <div className="lbl" style={{ marginBottom: 12 }}>{T('EVIDENCE AUDIT', 'साक्ष्य ऑडिट')}</div>
                      <div style={{ color: '#64748b', fontSize: 12, fontWeight: 800 }}>{medicine.sources.join(' • ')}</div>
                   </div>
                </div>

                <div style={{ marginBottom: 40 }}>
                   <div className="lbl" style={{ marginBottom: 16 }}>🎯 {T('CORE CLINICAL INDICATIONS', 'मुख्य क्लीनिकल उपयोग')}</div>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {(isHindi ? medicine.uses_hi : medicine.uses).map((u, i) => (
                        <div key={i} className="chip" style={{ background: '#f8fafc', border: '1px solid #f1f5f9', fontWeight: 700, fontSize: 13, color: '#475569' }}>
                          {u}
                        </div>
                      ))}
                   </div>
                </div>

                <div style={{ display: 'grid', gap: 24 }}>
                   <div style={{ background: '#f0fdf4', padding: 24, borderRadius: 20, border: '1px solid #d1fae5' }}>
                      <div className="lbl" style={{ color: '#059669', marginBottom: 12 }}>💊 {T('PRECISION DOSAGE PROTOCOL', 'सटीक खुराक प्रोटोकॉल')}</div>
                      <div style={{ fontSize: 15, color: '#064e3b', fontWeight: 800, lineHeight: 1.6 }}>
                        {isHindi ? medicine.dose_hi : medicine.dose}
                      </div>
                   </div>
                   <div style={{ background: '#fff1f2', padding: 24, borderRadius: 20, border: '1px solid #fecaca' }}>
                      <div className="lbl" style={{ color: '#e11d48', marginBottom: 12 }}>⚠️ {T('CRITICAL SYSTEM WARNINGS', 'महत्वपूर्ण सिस्टम चेतावनी')}</div>
                      <div style={{ display: 'grid', gap: 12 }}>
                         {(isHindi ? medicine.warnings_hi : medicine.warnings).map((w, i) => (
                           <div key={i} style={{ display: 'flex', gap: 12, fontSize: 13, color: '#9f1239', fontWeight: 600, lineHeight: 1.4 }}>
                              <span style={{ color: '#e11d48' }}>•</span> {w}
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* Economic Efficiency Module */}
          <div className="card-premium" style={{ marginBottom: 60, padding: 32 }}>
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin:0 }}>
                   💰 {isHindi ? 'मूल्य दक्षता ऑडिट' : 'Arbitrage & Pricing Audit'}
                </h3>
                <div style={{ background: '#059669', color: '#fff', padding: '8px 16px', borderRadius: 12, fontSize: 13, fontWeight: 900 }}>
                   {savings}% EFFICIENCY
                </div>
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {[
                  { label: isHindi ? 'ब्रांडेड औसत' : 'BRANDED AVG', price: medicine.price_branded, color: '#64748b' },
                  { label: isHindi ? 'जेनेरिक' : 'GENERIC', price: medicine.price_generic, color: '#2563eb' },
                  { label: 'PM JAN AUSHADHI', price: medicine.price_jan, color: '#059669', standout: true },
                ].map((p, idx) => (
                  <div key={idx} style={{ 
                    padding: 24, borderRadius: 20, textAlign: 'center',
                    background: p.standout ? '#ecfdf5' : '#f8fafc',
                    border: p.standout ? '1px solid #059669' : '1px solid #f1f5f9'
                  }}>
                     <div style={{ fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 12 }}>{p.label}</div>
                     <div style={{ fontSize: 32, fontWeight: 900, color: p.color }}>₹{p.price}</div>
                     <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 800, marginTop: 4 }}>PER 10 UNIT STRIP</div>
                  </div>
                ))}
             </div>
             
             <div className="alert alert-info" style={{ marginTop: 24, background: '#eff6ff', border: '1px solid #dbeafe' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                   <div style={{ fontSize: 24 }}>💹</div>
                   <div style={{ fontSize: 13, color: '#1e40af', fontWeight: 600, lineHeight: 1.5 }}>
                      <strong>{T('Financial Summary:', 'वित्तीय सारांश:')}</strong> {isHindi 
                        ? `जन औषधि केंद्र से खरीद पर ₹${medicine.price_branded - medicine.price_jan} प्रति स्ट्रिप की बचत संभव है।`
                        : `Clinical switch to PM Jan Aushadhi generic agents for this molecule yields a ₹${medicine.price_branded - medicine.price_jan} saving per 10-unit strip.`}
                   </div>
                </div>
             </div>
          </div>

          {/* ── Personalized Report CTA ── */}
          <div style={{ marginBottom: 40 }}>
            <button
              onClick={() => setActivePage('medireport')}
              style={{
                width: '100%', height: 56, borderRadius: 16,
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#fff', border: 'none', cursor: 'pointer',
                fontWeight: 900, fontSize: 15,
                boxShadow: '0 10px 24px rgba(99,102,241,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                letterSpacing: '0.02em',
              }}
            >
              🧾 {isHindi ? 'इस दवाई की व्यक्तिगत रिपोर्ट बनाएं →' : 'Generate Personalized Report for This Medicine →'}
            </button>
            <div style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 8, fontWeight: 600 }}>
              {isHindi ? 'अपनी बीमारी, एलर्जी दर्ज करें और देखें यह दवाई आपके लिए सुरक्षित है या नहीं' : 'Enter your conditions to get a safety verdict tailored to you'}
            </div>
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 11, fontWeight: 600 }}>
        📚 {T('Protocol: Audited via WHO EML 2023, Indian Pharmacopoeia & NPPA Ceiling Caps.', 'प्रोटोकॉल: WHO EML 2023, इंडियन फार्माकोपिया और NPPA सीलिंग कैप के माध्यम से ऑडिट किया गया।')}
      </div>
    </div>
  )
}
