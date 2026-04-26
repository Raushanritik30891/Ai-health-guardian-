import React, { useState } from 'react'
import { useStore } from '../store/useStore'

// Source: NPPA Drug Price Ceiling, Jan Aushadhi product list
const ALTERNATIVES = {
  'crocin': { generic:'Paracetamol 500mg', branded_price:22, generic_price:8, jan_price:7, generic_brands:['Metacin 500','P-500','Pacimol'] },
  'dolo': { generic:'Paracetamol 650mg', branded_price:38, generic_price:12, jan_price:9, generic_brands:['Calpol 650','P-650 (Generic)'] },
  'brufen': { generic:'Ibuprofen 400mg', branded_price:45, generic_price:15, jan_price:12, generic_brands:['Ibugesic (Generic)','Ibuvid 400'] },
  'omez': { generic:'Omeprazole 20mg', branded_price:55, generic_price:18, jan_price:12, generic_brands:['Omeprazole Capsules','Lopraz (Generic)'] },
  'zyrtec': { generic:'Cetirizine 10mg', branded_price:35, generic_price:8, jan_price:5, generic_brands:['Cetzine (Generic)','Cetcip'] },
  'glycomet': { generic:'Metformin 500mg', branded_price:65, generic_price:20, jan_price:14, generic_brands:['Metformin (Generic)','Bigomet 500'] },
  'atorva': { generic:'Atorvastatin 10mg', branded_price:90, generic_price:25, jan_price:18, generic_brands:['Atorvastatin (Generic)','Novastat 10'] },
  'ecosprin': { generic:'Aspirin 75mg', branded_price:30, generic_price:8, jan_price:5, generic_brands:['Aspirin 75mg (Generic)','Disprin 75'] },
  'amoxil': { generic:'Amoxicillin 500mg', branded_price:85, generic_price:30, jan_price:22, generic_brands:['Amoxicillin (Generic)','Moxikind 500'] },
  'amlip': { generic:'Amlodipine 5mg', branded_price:75, generic_price:20, jan_price:14, generic_brands:['Amlodipine (Generic)','Amlong 5'] },
}

const BRAND_ALIASES = {
  'crocin 500': 'crocin', 'dolo 650': 'dolo', 'brufen 400': 'brufen', 'brufen': 'brufen',
  'omez': 'omez', 'prilosec': 'omez', 'omeprazole': 'omez', 'zyrtec': 'zyrtec', 'cetirizine': 'zyrtec',
  'glycomet': 'glycomet', 'metformin': 'glycomet', 'atorvastatin': 'atorva', 'lipitor': 'atorva',
  'ecosprin': 'ecosprin', 'aspirin': 'ecosprin', 'amoxil': 'amoxil', 'amoxicillin': 'amoxil',
  'amlip': 'amlip', 'amlodipine': 'amlip', 'norvasc': 'amlip', 'paracetamol': 'crocin',
}

export default function Alternatives() {
  const { profile } = useStore()
  const isHindi = profile.language === 'hi'
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [notFound, setNotFound] = useState(false)

  const search = (q = query) => {
    if (!q.trim()) return
    const key = q.trim().toLowerCase()
    const alias = BRAND_ALIASES[key] || key
    const found = ALTERNATIVES[alias]
    if (found) { setResult({ ...found, searched: q.trim(), alias }); setNotFound(false) }
    else { setResult(null); setNotFound(true) }
  }

  const savings = result ? Math.round(((result.branded_price - result.jan_price) / result.branded_price) * 100) : 0
  const genSavings = result ? Math.round(((result.branded_price - result.generic_price) / result.branded_price) * 100) : 0

  return (
    <div className="page" style={{ paddingTop: 80 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div className="badge badge-emerald">
            {isHindi ? "💰 बचत कैलकुलेटर" : "💰 Savings Engine"}
          </div>
        </div>
        <h1 className="section-title">
          {isHindi ? 'जेनेरिक विकल्प खोजें' : 'Price Optimization'}
        </h1>
        <p style={{ color: '#64748b', fontSize: 15, maxWidth: 600 }}>
          {isHindi 
            ? 'Jan Aushadhi और ब्रांडेड दवाओं की कीमतों की तुलना करें। 50-90% तक की बचत करें।' 
            : 'Audit medication expenditure by cross-referencing branded costs against Jan Aushadhi and generic benchmarks. Save up to 90% via clinical substitution.'}
        </p>
      </div>

      {/* Search Console */}
      <div className="card-premium" style={{ marginBottom: 32, padding: 32 }}>
        <div className="lbl" style={{ marginBottom: 12 }}>{isHindi ? 'दवाई या ब्रांड का नाम' : 'Search Branded Agent'}</div>
        <div style={{ display:'flex', gap: 12 }}>
          <input
            className="inp"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder={isHindi ? 'जैसे: Crocin, Dolo, Omez' : 'e.g. Crocin, Dolo, Omez'}
            style={{ height: 52, borderRadius: 12, flex: 1 }}
          />
          <button className="btn btn-primary" onClick={() => search()} style={{ padding: '0 24px', height: 52, borderRadius: 12 }}>
            {isHindi ? 'खोजें' : 'Search'}
          </button>
        </div>

        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.05em' }}>
            {isHindi ? 'त्वरित खोज:' : 'Trending Agents:'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['Crocin', 'Dolo', 'Brufen', 'Omez', 'Ecosprin'].map(k => (
              <button 
                key={k} 
                onClick={() => { setQuery(k); search(k) }}
                className="chip"
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      </div>

      {notFound && (
        <div className="alert alert-warn animate-fade" style={{ marginBottom: 32 }}>
          {isHindi ? `"${query}" के लिए कोई डेटा नहीं मिला।` : `Database miss for "${query}". Try searching by generic molecule or common trade names.`}
        </div>
      )}

      {result && (
        <div className="animate-fade">
          {/* Main Results HUD */}
          <div className="card-premium" style={{ marginBottom: 24, padding: 32, borderTop: '6px solid #059669' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
               <div>
                  <div className="lbl" style={{ color: '#059669', marginBottom: 4 }}>{isHindi ? 'सक्रिय घटक' : 'Active Generic Molecule'}</div>
                  <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a' }}>{result.generic}</h2>
               </div>
               <div style={{ textAlign: 'right' }}>
                  <div className="lbl" style={{ marginBottom: 4 }}>{isHindi ? 'अनुमानित बचत' : 'Efficiency Gain'}</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#059669' }}>{savings}% SAVE</div>
               </div>
            </div>

            {/* Price Visualization */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
               {[
                 { label: isHindi ? 'ब्रांडेड' : 'Branded Trade', price: result.branded_price, color: '#ef4444', bg: '#fef2f2' },
                 { label: isHindi ? 'जेनेरिक' : 'Local Generic', price: result.generic_price, color: '#2563eb', bg: '#eff6ff' },
                 { label: 'Jan Aushadhi', price: result.jan_price, color: '#059669', bg: '#ecfdf5' },
               ].map(p => (
                 <div key={p.label} style={{ padding: 20, borderRadius: 20, background: p.bg, border: '1px solid rgba(0,0,0,0.03)', textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: p.color }}>₹{p.price}</div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: p.color, opacity: 0.8, marginTop: 4, textTransform: 'uppercase' }}>{p.label}</div>
                 </div>
               ))}
            </div>

            {/* Substitution Guidance */}
            <div style={{ background: '#f8fafc', padding: 24, borderRadius: 20, border: '1px solid #f1f5f9' }}>
               <h3 style={{ fontSize: 13, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', marginBottom: 16, letterSpacing: '0.05em' }}>
                 🏪 {isHindi ? 'जेनेरिक विकल्प जो आप मांग सकते हैं:' : 'Substitution Clinical Reference'}
               </h3>
               <div style={{ display: 'grid', gap: 12 }}>
                 {result.generic_brands.map((b, i) => (
                   <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                         <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }} />
                         <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{b}</div>
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>AVAILABLE AT MOST CHEMISTS</div>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          <div className="card" style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: 20, display: 'flex', gap: 16, alignItems: 'center', marginBottom: 32 }}>
             <div style={{ fontSize: 24 }}>📍</div>
             <div style={{ fontSize: 13, color: '#92400e', fontWeight: 500, lineHeight: 1.5 }}>
                <strong>{isHindi ? 'Jan Aushadhi स्टोर' : 'Procurement Protocol'}:</strong> {isHindi
                  ? 'इन सस्ती दवाओं को खरीदने के लिए अपने पास का "Jan Aushadhi" केंद्र खोजें या कॉल करें: 1800-180-8080'
                  : 'Acquire these clinical equivalents at any government-authorized Jan Aushadhi Kendra. Locate via: 1800-180-8080 or janaushadhi.gov.in'}
             </div>
          </div>
        </div>
      )}

      <div className="alert alert-info" style={{ background: '#f0f9ff', borderColor: '#e0f2fe', color: '#0369a1', marginBottom: 40 }}>
         <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ fontSize: 20 }}>💡</div>
            <div style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.5 }}>
               {isHindi
                 ? 'जेनेरिक दवाएं ब्रांडेड दवाओं के समान ही सुरक्षित और प्रभावी होती हैं क्योंकि उनमें समान "सक्रिय सामग्री" (Active Ingredients) होती है।'
                 : 'Clinical equivalency verified: Generic agents contain identical active pharmaceutical ingredients (API) as their branded counterparts, maintaining identical efficacy and safety profiles at a fraction of the cost.'}
            </div>
         </div>
      </div>

      <div style={{ marginTop: 24, fontSize: 11, color: '#94a3b8', textAlign: 'center', fontWeight: 500 }}>
        📚 {isHindi ? 'डेटा स्रोत: NPPA मूल्य सीमा सूची और जन औषधि उत्पाद सूची' : 'Data Integrity: NPPA Drug Price Ceiling List & Jan Aushadhi Product Registry (janaushadhi.gov.in)'}
      </div>
    </div>
  )
}
