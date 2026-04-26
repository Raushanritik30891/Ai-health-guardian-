/**
 * Language Selection Screen - shown on first open
 * Hindi / English choose karo
 */
import React from 'react'
import { useStore } from '../store/useStore'

export default function LanguageSelect() {
  const { setLanguageSelected, setProfile, profile } = useStore()
  const isHindi = profile.language === 'hi'
  const T = (en, hi) => isHindi ? hi : en

  const choose = (lang) => {
    setProfile({ language: lang })
    setLanguageSelected(true)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      position: 'relative',
      overflow: 'hidden',
      background: '#f8fafc'
    }}>
      {/* Mesh Background */}
      <div className="mesh-bh" />

      <div style={{ maxWidth: 440, width: '100%', position: 'relative', zIndex: 10 }} className="animate-fade">
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
           <div style={{
             width: 88, height: 88, borderRadius: 28,
             background: 'linear-gradient(135deg, #059669 0%, #065f46 100%)',
             display: 'flex', alignItems: 'center', justifyContent: 'center',
             fontSize: 40, margin: '0 auto 28px',
             boxShadow: '0 20px 40px rgba(5, 150, 105, 0.25)',
             border: '1px solid rgba(255,255,255,0.2)'
           }}>🛡️</div>

           <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.03em' }}>
             Health Guardian
           </h1>
           <div style={{ fontSize: 13, color: '#6366f1', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
             Clinical Intelligence Platform
           </div>
        </div>

        <div className="card-premium" style={{ padding: 40, border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.05)' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
             <div style={{ fontSize: 16, fontWeight: 700, color: '#475569' }}>
               Select Interface Language
             </div>
             <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>
               इंटरफेस भाषा का चयन करें
             </div>
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            {[
              { id: 'hi', label: 'हिंदी', sub: 'Continue in Hindi', flag: '🇮🇳' },
              { id: 'en', label: 'English', sub: 'Continue in English', flag: '🇬🇧' }
            ].map((lang) => (
              <button
                key={lang.id}
                onClick={() => choose(lang.id)}
                className="card-hover"
                style={{
                  padding: '20px 24px',
                  border: '2px solid #f1f5f9',
                  borderRadius: 20,
                  background: '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                  fontFamily: 'inherit'
                }}
              >
                <div style={{ 
                  width: 52, height: 52, borderRadius: 14, background: '#f8fafc',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, border: '1px solid #e2e8f0'
                }}>
                  {lang.flag}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>{lang.label}</div>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500, marginTop: 2 }}>{lang.sub}</div>
                </div>
                <div style={{ color: '#cbd5e1', fontSize: 20 }}>→</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 40, textAlign: 'center' }}>
           <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                 <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                 {T('BIO-SECURE SCANNING', 'बायो-सिक्योर स्कैनिंग')}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                 <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1' }} />
                 {T('AI DRUG AUDITING', 'AI ड्रग ऑडिटिंग')}
              </div>
           </div>
           <p style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 500, maxWidth: 300, margin: '0 auto' }}>
             © 2024 Clinical Intelligence Systems. <br/>
             {T('Emergency Protocol Active: Dial 108', 'आपातकालीन प्रोटोकॉल सक्रिय: 108 डायल करें')}
           </p>
        </div>
      </div>
    </div>
  )
}
