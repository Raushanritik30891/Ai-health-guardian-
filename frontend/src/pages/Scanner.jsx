// frontend/src/pages/Scanner.jsx

import React, { useState, useRef } from 'react'
import { useStore } from '../store/useStore'
import axios from 'axios'


// API URL configuration
const API_URL = import.meta.env.VITE_API_URL || ''

export default function Scanner() {
  const { profile, setActivePage } = useStore()

  const isHindi = profile?.language === 'hi'
  const [medicineName, setMedicineName] = useState('')
  const [result, setResult] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const fileInputRef = useRef(null)
  
  const T = (en, hi) => isHindi ? hi : en

  const searchByName = async (name = medicineName) => {
    if (!name.trim()) return
    
    setLoading(true)
    setNotFound(false)
    setResult(null)
    
    try {
      const formData = new FormData()
      formData.append('medicine_name', name)
      if (profile) {
        formData.append('user_profile', JSON.stringify(profile))
      }
      
      const response = await axios.post(`${API_URL}/api/scanner/search-by-name`, formData)
      
      if (response.data.success) {
        setResult({
          ...response.data.medicine_data,
          alerts: response.data.personalized_risks || []
        })
        setNotFound(false)
      } else {
        setNotFound(true)
      }
    } catch (error) {
      console.error('Search error:', error)
      if (error.response?.status === 404) {
        setNotFound(true)
      } else {
        alert(T('Error searching medicine. Make sure backend is running on port 8000', 
                 'दवाई खोजने में त्रुटि। सुनिश्चित करें backend port 8000 पर चल रहा है'))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    setSelectedImage(URL.createObjectURL(file))
    setLoading(true)
    setResult(null)
    setNotFound(false)
    
    const formData = new FormData()
    formData.append('file', file)
    if (profile) {
      formData.append('user_profile', JSON.stringify(profile))
    }
    
    try {
      const response = await axios.post(`${API_URL}/api/scanner/scan-image`, formData, {
        timeout: 30000
      })
      
      if (response.data.success && response.data.medicine_found) {
        setResult({
          ...response.data.medicine_data,
          alerts: response.data.personalized_risks || [],
          scanned_text: response.data.ocr_text,
          ocr_extracted: response.data.ocr_extracted
        })
        setMedicineName(response.data.medicine_key || '')
      } else {
        setNotFound(true)
        const errorMsg = response.data.ocr_text || response.data.message || 'Could not detect medicine'
        alert(T(`Could not detect medicine: ${errorMsg}`, 
                 `दवाई नहीं पहचानी गई: ${errorMsg}`))
      }
    } catch (error) {
      console.error('Upload error:', error)
      if (error.code === 'ECONNABORTED') {
        alert(T('Request timeout. Please try again.', 'अनुरोध समय सीमा समाप्त। कृपया पुनः प्रयास करें।'))
      } else if (error.code === 'ERR_NETWORK') {
        alert(T('Cannot connect to backend. Make sure server is running on port 8000', 
                 'बैकएंड से कनेक्ट नहीं हो सकता। सुनिश्चित करें सर्वर port 8000 पर चल रहा है'))
      } else {
        alert(T('Error scanning image: ' + (error.response?.data?.detail || error.message), 
                 'छवि स्कैन करने में त्रुटि: ' + (error.response?.data?.detail || error.message)))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page" style={{ paddingTop: 80 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div className="badge badge-indigo">
             {isHindi ? "📸 विजुअल एनालिसिस" : "📸 Visual Intelligence"}
          </div>
        </div>
        <h1 className="section-title">
          {isHindi ? 'दवाई स्कैनर' : 'Diagnostic Scanner'}
        </h1>
        <p style={{ color: '#64748b', fontSize: 15, maxWidth: 600 }}>
          {isHindi 
            ? 'दवाई की पट्टी की फोटो लें। हमारा AI स्वतः नाम, एक्सपायरी और सुरक्षा जोखिमों को पहचान लेगा।' 
            : 'Deploy computer vision to audit medication strips. Auto-detect composition, clinical warnings, and manufacturer metadata.'}
        </p>
      </div>

      {/* Main Scanner Hub */}
      <div className="card-premium" style={{ 
        marginBottom: 32, padding: 0, overflow: 'hidden', 
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        border: 'none', boxShadow: '0 20px 40px rgba(30, 27, 75, 0.25)'
      }}>
        <div style={{ padding: 40, textAlign: 'center', position: 'relative' }}>
           {/* Animated scanning lines ornament */}
           <div style={{ 
             position: 'absolute', top: 0, left: 0, right: 0, height: 2, 
             background: 'linear-gradient(90deg, transparent, #818cf8, transparent)',
             animation: 'scan 3s ease-in-out infinite'
           }} />

           <div style={{ position: 'relative', zIndex: 2 }}>
             <div style={{ 
               width: 80, height: 80, borderRadius: 24, background: 'rgba(255,255,255,0.1)', 
               display: 'flex', alignItems: 'center', justifyContent: 'center', 
               fontSize: 40, margin: '0 auto 24px', backdropFilter: 'blur(10px)',
               border: '1px solid rgba(255,255,255,0.2)'
             }}>📸</div>
             
             <h3 style={{ color: '#fff', fontSize: 20, fontWeight: 900, marginBottom: 8, letterSpacing: '-0.02em' }}>
               {isHindi ? 'कैमरा पोर्टल' : 'Optical Intelligence Portal'}
             </h3>
             <p style={{ color: '#c7d2fe', fontSize: 14, marginBottom: 32, opacity: 0.8 }}>
               {isHindi ? 'दवाई की स्पष्ट फोटो अपलोड करें' : 'Upload or capture clear medication packaging'}
             </p>

             <input
               ref={fileInputRef}
               type="file"
               accept="image/*"
               capture="environment"
               onChange={handleImageUpload}
               style={{ display: 'none' }}
             />
             
             <button
               onClick={() => fileInputRef.current?.click()}
               className="btn animate-fade"
               style={{
                 width: '100%', maxWidth: 300, height: 56,
                 background: '#fff', color: '#312e81',
                 fontWeight: 800, fontSize: 15, borderRadius: 16, border: 'none',
                 cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
               }}
               disabled={loading}
             >
               {loading ? (isHindi ? '🔍 प्रोसेसिंग...' : '🔍 ANALYZING...') : (isHindi ? 'फोटो लें / अपलोड करें' : 'INITIATE SCAN')}
             </button>
           </div>
        </div>

        {selectedImage && (
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: 20, textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <img src={selectedImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 12, boxShadow: '0 8px 16px rgba(0,0,0,0.2)'}} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
         <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
         <div style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>{T('OR', 'अथवा')}</div>
         <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
      </div>

      {/* Manual Search Console */}
      <div className="card-premium" style={{ marginBottom: 40, padding: 32 }}>
        <div className="lbl" style={{ marginBottom: 12 }}>{T('Manual Identifier', 'मैन्युअल पहचानकर्ता')}</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <input
            className="inp"
            value={medicineName}
            onChange={e => setMedicineName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchByName()}
            placeholder={T('e.g., Crocin, Brufen, Amoxil', 'जैसे, क्रोसिन, ब्रुफेन, अमोक्सिल')}
            disabled={loading}
            style={{ height: 52, borderRadius: 12, flex: 1 }}
          />
          <button
            className="btn btn-primary"
            onClick={() => searchByName()}
            disabled={loading}
            style={{ width: 60, height: 52, padding: 0, borderRadius: 12 }}
          >
            {loading ? '...' : '🔍'}
          </button>
        </div>
        
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.05em' }}>
            {T('Rapid Insights:', 'त्वरित अंतर्दृष्टि:')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['Crocin', 'Brufen', 'Omez', 'Glycomet'].map(m => (
              <button
                key={m}
                onClick={() => { setMedicineName(m); searchByName(m); }}
                className="chip"
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results HUD */}
      {result && !loading && (
        <div className="animate-fade">
          {/* Risk Alerts */}
          {result.alerts?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
               {result.alerts.map((alert, i) => (
                 <div key={i} className={`alert alert-${alert.type === 'danger' ? 'danger' : 'warn'}`} style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 800 }}>{alert.title}</div>
                    <div style={{ opacity: 0.9 }}>{alert.message}</div>
                 </div>
               ))}
            </div>
          )}

          {/* Clinical Specification Sheet */}
          <div className="card-premium" style={{ borderTop: '6px solid #059669' }}>
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                   <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>
                     {result.generic_name || result.name}
                   </h2>
                   <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>{result.category}</div>
                </div>
                <div className={`badge ${result.otc ? 'badge-emerald' : 'badge-rose'}`}>
                   {result.otc ? 'OTC AVAILABLE' : 'BY PRESCRIPTION ONLY'}
                </div>
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <div style={{ background: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid #f1f5f9' }}>
                   <div className="lbl" style={{ marginBottom: 8, color: '#059669' }}>💊 {T('Primary Usage', 'मुख्य उपयोग')}</div>
                   <div style={{ fontSize: 14, color: '#1e293b', fontWeight: 600, lineHeight: 1.5 }}>{result.uses}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid #f1f5f9' }}>
                   <div className="lbl" style={{ marginBottom: 8, color: '#2563eb' }}>📏 {T('Clinical Dosage', 'नैदानिक खुराक')}</div>
                   <div style={{ fontSize: 14, color: '#1e293b', fontWeight: 600, lineHeight: 1.5 }}>{result.dosage}</div>
                </div>
             </div>

             {/* OCR Metadata */}
             {result.ocr_extracted && Object.keys(result.ocr_extracted).length > 0 && (
                <div style={{ marginTop: 24, padding: 24, background: '#f0fdf4', borderRadius: 20, border: '1px solid #d1fae5' }}>
                   <div style={{ fontSize: 12, fontWeight: 900, color: '#059669', textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>📋</span> {T('Hardware Telemetry / OCR Data', 'हार्डवेयर टेलीमेट्री / OCR डेटा')}
                   </div>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                      {result.ocr_extracted.expiry_date && (
                        <div>
                           <div style={{ fontSize: 10, color: '#065f46', opacity: 0.7, fontWeight: 800 }}>EXPIRY</div>
                           <div style={{ fontSize: 13, fontWeight: 800, color: '#064e3b' }}>{result.ocr_extracted.expiry_date}</div>
                        </div>
                      )}
                      {result.ocr_extracted.batch_number && (
                        <div>
                           <div style={{ fontSize: 10, color: '#065f46', opacity: 0.7, fontWeight: 800 }}>BATCH</div>
                           <div style={{ fontSize: 13, fontWeight: 800, color: '#064e3b' }}>{result.ocr_extracted.batch_number}</div>
                        </div>
                      )}
                      {result.ocr_extracted.mrp && (
                        <div>
                           <div style={{ fontSize: 10, color: '#065f46', opacity: 0.7, fontWeight: 800 }}>COST</div>
                           <div style={{ fontSize: 13, fontWeight: 800, color: '#064e3b' }}>{result.ocr_extracted.mrp}</div>
                        </div>
                      )}
                   </div>
                </div>
             )}
           </div>

           {/* Personalized Report CTA */}
           <div style={{ marginTop: 24 }}>
             <button
               onClick={() => setActivePage('medireport')}
               style={{
                 width: '100%', height: 52, borderRadius: 14,
                 background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                 color: '#fff', border: 'none', cursor: 'pointer',
                 fontWeight: 900, fontSize: 15,
                 boxShadow: '0 8px 20px rgba(99,102,241,0.3)',
                 display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
               }}
             >
               🧾 {isHindi ? 'इस दवाई की व्यक्तिगत रिपोर्ट देखें →' : 'Get Personalized Report for This Medicine →'}
             </button>
           </div>
         </div>
       )}

      {notFound && (
        <div className="alert alert-warn card-premium animate-fade" style={{ background: '#fffbeb', borderColor: '#fef3c7' }}>
           <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ fontSize: 24 }}>🤔</div>
              <div>
                <div style={{ fontWeight: 800, color: '#92400e' }}>{T('Agent Not Found', 'पहचान विफल')}</div>
                <div style={{ fontSize: 13, color: '#b45309' }}>{T(`Could not cross-reference "${medicineName}" in local database. Check spelling or upload a clearer photo.`, `स्थानीय डेटाबेस में "${medicineName}" नहीं मिल सका। स्पेलिंग जांचें या स्पष्ट फोटो लें।`)}</div>
              </div>
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