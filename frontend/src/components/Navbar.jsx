import React, { useState } from 'react'
import { useStore } from '../store/useStore'
import {
  ShieldCheck, LayoutDashboard, Search, History,
  User, Activity, Globe, X, Menu, Zap, Home
} from 'lucide-react'

const NAV_ITEMS = [
  { id: 'dashboard',    icon: Home,            label: 'Home',         labelHi: 'होम' },
  { id: 'search',       icon: Search,          label: 'Check',        labelHi: 'जांचें' },
  { id: 'interactions', icon: Zap,             label: 'Interact',     labelHi: 'रिएक्शन' },
  { id: 'symptoms',     icon: Activity,        label: 'Symptoms',     labelHi: 'लक्षण' },
  { id: 'profile',      icon: User,            label: 'Profile',      labelHi: 'प्रोफाइल' },
]

function LogoMark() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-md shadow-blue-600/30 flex-shrink-0">
        <ShieldCheck className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
      </div>
      <div className="hidden sm:block">
        <div className="font-bold text-sm text-slate-900 leading-tight tracking-tight">AI Health Guardian</div>
        <div className="text-[10px] font-semibold text-slate-400 leading-tight">Medicine Safety Copilot</div>
      </div>
    </div>
  )
}

export default function Navbar() {
  const { activePage, setActivePage, profile, setProfile, user } = useStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isHindi = profile?.language === 'hi'

  const go = (id) => {
    setActivePage(id)
    setMobileMenuOpen(false)
  }

  const switchLang = () => {
    setProfile({ language: isHindi ? 'en' : 'hi' })
  }

  return (
    <>
      {/* ── Desktop / Top Bar ── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 h-16"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(226,232,240,0.8)',
        }}
      >
        <div className="max-w-6xl mx-auto h-full px-4 flex items-center justify-between gap-4">
          {/* Logo */}
          <button onClick={() => go('home')} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-md shadow-blue-600/30">
              <ShieldCheck className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 leading-tight">AI Health Guardian</div>
              <div className="text-[10px] font-semibold text-slate-400 leading-none">Medicine Safety Copilot</div>
            </div>
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ id, icon: Icon, label, labelHi }) => {
              const isActive = activePage === id
              return (
                <button
                  key={id}
                  onClick={() => go(id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {isHindi ? labelHi : label}
                </button>
              )
            })}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Emergency */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-100 rounded-lg">
              <span className="text-red-500 text-xs">🚑</span>
              <span className="text-xs font-bold text-red-600">108</span>
            </div>

            {/* Language */}
            <button
              onClick={switchLang}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">{isHindi ? 'EN' : 'हिंदी'}</span>
            </button>

            {/* Auth / Profile */}
            {user ? (
              <button
                onClick={() => go('profile')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${activePage === 'profile' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {(profile?.name || user?.email || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              </button>
            ) : (
              <button
                onClick={() => go('auth')}
                className="btn-primary hidden sm:flex py-2 px-4 text-sm min-h-[36px]"
              >
                {isHindi ? 'लॉगिन' : 'Sign In'}
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(v => !v)}
              className="md:hidden w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Drawer ── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="absolute top-16 left-0 right-0 bg-white border-b border-slate-200 shadow-xl p-4 space-y-1 animate-slide-down"
            onClick={e => e.stopPropagation()}
          >
            {NAV_ITEMS.map(({ id, icon: Icon, label, labelHi }) => (
              <button
                key={id}
                onClick={() => go(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-left transition-all ${
                  activePage === id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {isHindi ? labelHi : label}
              </button>
            ))}
            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <button
                onClick={switchLang}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600"
              >
                <Globe className="w-4 h-4" />
                {isHindi ? 'Switch to English' : 'हिंदी में बदलें'}
              </button>
              {!user && (
                <button
                  onClick={() => go('auth')}
                  className="flex-1 btn-primary py-3 text-sm min-h-0"
                >
                  {isHindi ? 'लॉगिन करें' : 'Sign In'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Navigation — pill active indicator ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(226,232,240,0.9)',
        }}
      >
        <div className="flex items-stretch h-[60px] px-1">
          {NAV_ITEMS.map(({ id, icon: Icon, label, labelHi }) => {
            const isActive = activePage === id
            return (
              <button
                key={id}
                onClick={() => go(id)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-all relative ${
                  isActive ? 'text-blue-600' : 'text-slate-400 active:text-slate-600'
                }`}
              >
                {/* Active pill */}
                {isActive && (
                  <div className="absolute top-1.5 left-1 right-1 h-8 bg-blue-50 rounded-xl" />
                )}
                <Icon
                  className="w-5 h-5 relative z-10"
                  strokeWidth={isActive ? 2.5 : 1.75}
                />
                <span className={`text-[9px] font-bold leading-none relative z-10 transition-all ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                  {isHindi ? labelHi : label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
