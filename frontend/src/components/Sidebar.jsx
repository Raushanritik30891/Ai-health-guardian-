import React, { useState } from 'react'
import { useStore } from '../store/useStore'

const NAV_EN = [
  { id: 'home',         icon: '🏠', label: 'Home' },
  { id: 'symptoms',     icon: '🤒', label: 'Symptom Check' },
  { id: 'medireport',   icon: '🧾', label: 'Personalized Report' },
  { id: 'interactions', icon: '⚠️', label: 'Drug Interactions' },
  { id: 'alternatives', icon: '🔁', label: 'Alternatives' },
  { id: 'remedies',     icon: '🌿', label: 'Home Remedies' },
  { id: 'prices',       icon: '💰', label: 'Price Compare' },
  { id: 'stores',       icon: '📍', label: 'Nearby Stores' },
  { id: 'profile',      icon: '👤', label: 'My Profile' },
]

const NAV_HI = [
  { id: 'home',         icon: '🏠', label: 'होम' },
  { id: 'symptoms',     icon: '🤒', label: 'लक्षण जांच' },
  { id: 'medireport',   icon: '🧾', label: 'व्यक्तिगत रिपोर्ट' },
  { id: 'interactions', icon: '⚠️', label: 'दवा इंटरेक्शन' },
  { id: 'alternatives', icon: '🔁', label: 'सस्ते विकल्प' },
  { id: 'remedies',     icon: '🌿', label: 'घरेलू उपाय' },
  { id: 'prices',       icon: '💰', label: 'कीमत तुलना' },
  { id: 'stores',       icon: '📍', label: 'नज़दीकी दुकान' },
  { id: 'profile',      icon: '👤', label: 'मेरी प्रोफाइल' },
]

function NavContent({ onNavigate }) {
  const { activePage, setActivePage, profile, setProfile } = useStore()
  const isHindi = profile.language === 'hi'
  const NAV = isHindi ? NAV_HI : NAV_EN

  const go = (id) => {
    setActivePage(id)
    onNavigate?.()
  }

  const switchLang = () => {
    setProfile({ language: isHindi ? 'en' : 'hi' })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
      {/* Logo Area */}
      <div style={{ padding: '24px 20px', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #059669 0%, #065f46 100%)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 20, flexShrink: 0,
            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
          }}>🛡️</div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ 
              fontWeight: 800, fontSize: 15, color: '#0f172a',
              letterSpacing: '-0.02em', whiteSpace: 'nowrap'
            }}>
              Health Guardian
            </div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
              {isHindi ? 'डिजिटल स्वास्थ्य रक्षक' : "Your Digital Guardian"}
            </div>
          </div>
        </div>

        {profile.name && (
          <div style={{
            marginTop: 16, padding: '10px 12px', borderRadius: 12,
            background: '#ecfdf5', border: '1px solid #d1fae5',
            fontSize: 12, color: '#065f46', fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <span style={{ fontSize: 16 }}>👤</span>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile.name}{profile.age ? `, ${profile.age}yr` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '0 12px', overflowY: 'auto' }}>
        {NAV.map(({ id, icon, label }) => {
          const active = activePage === id
          return (
            <button
              key={id}
              onClick={() => go(id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '11px 12px',
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: 14,
                fontFamily: 'inherit',
                fontWeight: active ? 700 : 500,
                background: active ? '#f0fdf4' : 'transparent',
                color: active ? '#059669' : '#475569',
                marginBottom: 4,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={e => !active && (e.currentTarget.style.background = '#f8fafc')}
              onMouseLeave={e => !active && (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ 
                fontSize: 18, width: 24, textAlign: 'center',
                opacity: active ? 1 : 0.7 
              }}>{icon}</span>
              <span style={{ letterSpacing: '-0.01em' }}>{label}</span>
              {active && (
                <div style={{ 
                  marginLeft: 'auto', width: 6, height: 6, 
                  borderRadius: '50%', background: '#059669' 
                }} />
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer / Settings */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid #f1f5f9' }}>
        <button
          onClick={switchLang}
          style={{
            width: '100%', padding: '10px', borderRadius: 10,
            border: '1px solid #e2e8f0', background: '#fff',
            cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
            color: '#1e293b', marginBottom: 12, fontWeight: 700,
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}
        >
          🌐 <span style={{fontSize: 12}}>{isHindi ? 'Switch to English' : 'हिंदी में बदलें'}</span>
        </button>
        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
          <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:4 }}>
            <span style={{ color: '#ef4444' }}>🚑</span> 
            <span>Emergency: <strong style={{ color: '#ef4444', fontWeight: 800 }}>108</strong></span>
          </div>
          <div style={{ opacity: 0.8 }}>AI Guardian v3.0 · India 🇮🇳</div>
        </div>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { profile } = useStore()
  const isHindi = profile.language === 'hi'

  return (
    <>
      {/* Desktop */}
      <aside style={{
        display: 'none',
        position: 'fixed', left: 0, top: 0, bottom: 0, width: 220,
        background: 'white', borderRight: '1px solid #e2e8f0',
        zIndex: 30, flexDirection: 'column',
      }} className="md-sidebar">
        <NavContent />
      </aside>

      {/* Mobile header */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        background: 'white', borderBottom: '1px solid #e2e8f0',
      }} className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: '#16a34a', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 16,
          }}>🛡️</div>
          <span style={{ fontWeight: 800, fontSize: 14, color: '#1a202c' }}>AI Health Guardian</span>
        </div>
        <button
          onClick={() => setMobileOpen(v => !v)}
          style={{
            padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
            background: 'white', cursor: 'pointer', fontSize: 18,
          }}
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 20,
          }}
          onClick={() => setMobileOpen(false)}
          className="mobile-drawer-overlay"
        >
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
          <aside
            style={{
              position: 'absolute', left: 0, top: 0, bottom: 0, width: 260,
              background: 'white', zIndex: 30, overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <NavContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .md-sidebar { display: flex !important; }
          .mobile-header { display: none !important; }
        }
      `}</style>
    </>
  )
}
