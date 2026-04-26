import React, { useState } from 'react'
import { useStore } from '../store/useStore'

// Source: NPPA ceiling prices + approximate current retail prices
const PRICE_DATA = {
  paracetamol: { name:'Paracetamol 500mg (10 tabs)', branded:'Crocin 500', b:22, pe:19, nm:21, gen:8, jan:7 },
  paracetamol650: { name:'Paracetamol 650mg (10 tabs)', branded:'Dolo 650', b:38, pe:34, nm:36, gen:12, jan:9 },
  ibuprofen: { name:'Ibuprofen 400mg (10 tabs)', branded:'Brufen 400', b:45, pe:40, nm:43, gen:15, jan:12 },
  cetirizine: { name:'Cetirizine 10mg (10 tabs)', branded:'Zyrtec', b:35, pe:32, nm:34, gen:8, jan:5 },
  omeprazole: { name:'Omeprazole 20mg (10 caps)', branded:'Omez', b:55, pe:50, nm:53, gen:18, jan:12 },
  amoxicillin: { name:'Amoxicillin 500mg (10 caps)', branded:'Amoxil', b:85, pe:78, nm:82, gen:30, jan:22 },
  metformin: { name:'Metformin 500mg (10 tabs)', branded:'Glycomet 500', b:65, pe:58, nm:62, gen:20, jan:14 },
  atorvastatin: { name:'Atorvastatin 10mg (10 tabs)', branded:'Atorva 10', b:90, pe:82, nm:86, gen:25, jan:18 },
  aspirin: { name:'Aspirin 75mg (14 tabs)', branded:'Ecosprin 75', b:30, pe:27, nm:29, gen:8, jan:5 },
  amlodipine: { name:'Amlodipine 5mg (10 tabs)', branded:'Amlip 5', b:75, pe:68, nm:72, gen:20, jan:14 },
}

export default function PriceCompare() {
  const { profile } = useStore()
  const isHindi = profile.language === 'hi'
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [notFound, setNotFound] = useState(false)

  const search = (q = query) => {
    if (!q.trim()) return
    const k = q.trim().toLowerCase()
    const found = PRICE_DATA[k]
      || Object.entries(PRICE_DATA).find(([key,v]) => v.name.toLowerCase().includes(k) || v.branded.toLowerCase().includes(k))?.[1]
    if (found) { setResult(found); setNotFound(false) }
    else { setResult(null); setNotFound(true) }
  }

  const T = (en, hi) => isHindi ? hi : en

  return (
    <div className="page" style={{ paddingTop: 80 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div className="badge badge-emerald">
            {isHindi ? "⚖️ मूल्य तुलना" : "⚖️ Arbitrage Analysis"}
          </div>
        </div>
        <h1 className="section-title">
          {isHindi ? 'दवाई मूल्य तुलना' : 'Market Price Audit'}
        </h1>
        <p style={{ color: '#64748b', fontSize: 15, maxWidth: 600 }}>
          {isHindi 
            ? '1mg, PharmEasy, और Netmeds जैसे ऑनलाइन प्लेटफॉर्म्स की तुलना Jan Aushadhi से करें।' 
            : 'Audit medication pricing across 1mg, PharmEasy, Netmeds, and Jan Aushadhi hubs using NPPA clinical ceiling data.'}
        </p>
      </div>

      {/* Search Console */}
      <div className="card-premium" style={{ marginBottom: 32, padding: 32 }}>
        <div className="lbl" style={{ marginBottom: 12 }}>{T('Search Medication', 'दवाई खोजें')}</div>
        <div style={{ display:'flex', gap: 12 }}>
          <input
            className="inp"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder={isHindi ? 'जैसे: Paracetamol, Omez' : 'e.g. Paracetamol, Omez'}
            style={{ height: 52, borderRadius: 12, flex: 1 }}
          />
          <button className="btn btn-primary" onClick={() => search()} style={{ padding: '0 24px', height: 52, borderRadius: 12 }}>
            {isHindi ? 'खोजें' : 'Search'}
          </button>
        </div>

        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.05em' }}> {T('Trending Molecule:', 'ट्रेंडिंग दवाई:')} </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.keys(PRICE_DATA).slice(0, 5).map(k => (
              <button key={k} onClick={() => { setQuery(k); search(k) }} className="chip" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                {k}
              </button>
            ))}
          </div>
        </div>
      </div>

      {notFound && (
        <div className="alert alert-warn animate-fade" style={{ marginBottom: 32 }}>
          {T(`"${query}" not found. Try generic molecule identifiers.`, `"${query}" के लिए कोई डेटा नहीं मिला।`)}
        </div>
      )}

      {result && (
        <div className="animate-fade">
          {/* Main Comparison HUD */}
          <div className="card-premium" style={{ marginBottom: 24, padding: 32, borderTop: '6px solid #6366f1' }}>
             <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>{result.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                   <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>{T('Branded Benchmark:', 'ब्रांडेड बेंचमार्क:')}</div>
                   <div className="badge badge-indigo" style={{ background: '#eef2ff', color: '#6366f1', fontSize: 10 }}>{result.branded}</div>
                </div>
             </div>

             <div style={{ display: 'grid', gap: 20 }}>
                {[
                  { label: 'TATA 1mg', price: result.b, color: '#f97316' },
                  { label: 'PharmEasy', price: result.pe, color: '#059669' },
                  { label: 'Netmeds', price: result.nm, color: '#2563eb' },
                  { label: T('Generic Chemist', 'जेनेरिक केमिस्ट'), price: result.gen, color: '#4338ca' },
                  { label: 'PM Jan Aushadhi', price: result.jan, color: '#059669', standout: true },
                ].map((p, idx) => (
                  <div key={idx} style={{ 
                    padding: p.standout ? '16px 20px' : '0', 
                    borderRadius: p.standout ? '16px' : '0',
                    background: p.standout ? '#ecfdf5' : 'transparent',
                    border: p.standout ? '1px solid #d1fae5' : 'none'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#334155' }}>{p.label}</span>
                          {p.standout && <div className="badge" style={{ background: '#059669', color: '#fff', fontSize: 9 }}>OPTIMAL</div>}
                       </div>
                       <div style={{ fontSize: 15, fontWeight: 900, color: p.color }}>₹{p.price}</div>
                    </div>
                    <div style={{ height: 10, background: '#f1f5f9', borderRadius: 5, overflow: 'hidden' }}>
                       <div style={{ 
                         height: '100%', background: p.color, 
                         width: `${(p.price / result.b) * 100}%`,
                         transition: 'width 0.5s ease-out'
                       }} />
                    </div>
                  </div>
                ))}
             </div>
          </div>

          {/* Efficiency Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 32 }}>
             <div className="card-premium" style={{ background: '#ecfdf5', borderColor: '#d1fae5', textAlign: 'center', padding: 24 }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#059669', marginBottom: 4 }}>₹{result.b - result.jan} SAVE</div>
                <div className="lbl" style={{ color: '#059669' }}>{T('vs Market Avg', 'बाजार औसत की तुलना में')}</div>
             </div>
             <div className="card-premium" style={{ background: '#eff6ff', borderColor: '#dbeafe', textAlign: 'center', padding: 24 }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#2563eb', marginBottom: 4 }}>{Math.round(((result.b - result.jan)/result.b)*100)}%</div>
                <div className="lbl" style={{ color: '#2563eb' }}>{T('Efficiency Gain', 'मूल्य दक्षता')}</div>
             </div>
          </div>
        </div>
      )}

      <div className="alert alert-info" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
         <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ fontSize: 24 }}>🏪</div>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, lineHeight: 1.5 }}>
               <strong>{T('Retail Procurement:', 'खरीद प्रक्रिया:')}</strong> {T(
                 'Government-certified Jan Aushadhi stores maintain clinical quality parity with branded agents while significantly reducing cost overheads.',
                 'सरकारी प्रमाणित जन औषधि केंद्र ब्रांडेड दवाओं की तुलना में काफी कम कीमत पर समान गुणवत्ता वाली दवाएं प्रदान करते हैं।'
               )}
            </div>
         </div>
      </div>

      <div style={{ marginTop: 24, fontSize: 11, color: '#94a3b8', textAlign: 'center', fontWeight: 500 }}>
        📚 {T('Integrity Check: NPPA Drug Price Ceiling & Jan Aushadhi Official List. Market prices approximate.', 'डेटा अखंडता: NPPA ड्रग प्राइस सीलिंग और जन औषधि आधिकारिक सूची। बाजार मूल्य अनुमानित हैं।')}
      </div>
    </div>
  )
}
