import React from 'react'
import { useStore } from '../store/useStore'
import {
  ShieldCheck, Camera, Mic, Search, Zap,
  Activity, ShieldAlert, MapPin, MessageSquarePlus,
  WifiOff, Users, BadgeCheck, Stethoscope, Languages, Store,
  ArrowRight, Pill, TrendingUp, ChevronRight
} from 'lucide-react'

const COMING_SOON = [
  { title: 'Fake Medicine Detection', titleHi: 'नकली दवा पहचान', icon: ShieldAlert },
  { title: 'Jan Aushadhi Map', titleHi: 'जन औषधि मैप', icon: Store },
  { title: 'Nearby Pharmacy', titleHi: 'नज़दीकी दवाखाना', icon: MapPin },
  { title: 'More Languages', titleHi: 'और भाषाएं', icon: Languages },
  { title: 'AI Health Chat', titleHi: 'AI हेल्थ चैट', icon: MessageSquarePlus },
  { title: 'Offline Mode', titleHi: 'ऑफलाइन मोड', icon: WifiOff },
  { title: 'Family Accounts', titleHi: 'परिवार अकाउंट', icon: Users },
  { title: 'ABHA Integration', titleHi: 'ABHA कार्ड', icon: BadgeCheck },
  { title: 'Doctor Consult', titleHi: 'डॉक्टर परामर्श', icon: Stethoscope },
]

function getGreeting(isHindi) {
  const h = new Date().getHours()
  if (isHindi) {
    if (h < 12) return 'सुप्रभात'
    if (h < 17) return 'नमस्कार'
    return 'शुभ संध्या'
  }
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const { setActivePage, profile, user, searchHistory } = useStore()
  const isHindi = profile?.language === 'hi'
  const name = profile?.name || user?.displayName || ''

  const completeness = (() => {
    const p = profile || {}
    const fields = [p.name, p.age, p.gender, p.diseases?.length, p.allergies?.length, p.currentMedicines?.length]
    return Math.round((fields.filter(Boolean).length / 6) * 100)
  })()

  const lastSearch = searchHistory?.[0] || null

  const ACTIVE_CARDS = [
    {
      id: 'search', icon: Search,
      iconBg: 'bg-blue-600', cardBg: 'bg-gradient-to-br from-blue-50 to-blue-100/40', border: 'border-blue-100',
      title: isHindi ? 'दवा खोजें / जांचें' : 'Search & Check Medicine',
      desc: isHindi ? 'नाम टाइप करें — AI सुरक्षा रिपोर्ट पाएं' : 'Type medicine name for instant AI safety report',
      hot: true,
    },
    {
      id: 'scan', icon: Camera,
      iconBg: 'bg-emerald-600', cardBg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/40', border: 'border-emerald-100',
      title: isHindi ? 'स्ट्रिप स्कैन' : 'Scan Medicine Strip',
      desc: isHindi ? 'पत्ते की फोटो लें — AI पढ़ेगा' : 'Take photo of strip — AI reads it',
    },
    {
      id: 'voice', icon: Mic,
      iconBg: 'bg-amber-600', cardBg: 'bg-gradient-to-br from-amber-50 to-amber-100/40', border: 'border-amber-100',
      title: isHindi ? 'हिंदी में बोलें' : 'Speak in Hindi',
      desc: isHindi ? 'दवा का नाम हिंदी में बोलें' : 'Say medicine name — no typing',
    },
    {
      id: 'interactions', icon: Zap,
      iconBg: 'bg-purple-600', cardBg: 'bg-gradient-to-br from-purple-50 to-purple-100/40', border: 'border-purple-100',
      title: isHindi ? 'ड्रग इंटरेक्शन' : 'Drug Interactions',
      desc: isHindi ? '2+ दवाओं का रिएक्शन जांचें' : 'Check if medicines react dangerously',
    },
    {
      id: 'symptoms', icon: Activity,
      iconBg: 'bg-rose-600', cardBg: 'bg-gradient-to-br from-rose-50 to-rose-100/40', border: 'border-rose-100',
      title: isHindi ? 'लक्षण जांचें' : 'Symptom Checker',
      desc: isHindi ? 'लक्षण चुनें — AI गाइडेंस पाएं' : 'Describe symptoms for AI guidance',
    },
  ]

  return (
    <div className="page">

      {/* ── Hero Welcome Header ── */}
      <div className="mb-6 animate-card-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-400 mb-0.5">
              {getGreeting(isHindi)}{name ? `, ${name}` : ''} 👋
            </p>
            <h1 className="text-2xl font-black text-slate-900 leading-tight">
              {isHindi ? 'आज क्या जांचना है?' : 'What to check today?'}
            </h1>
          </div>
          {/* Emergency tap */}
          <a href="tel:108" className="flex-shrink-0 flex flex-col items-center px-3 py-2 bg-red-50 border border-red-100 rounded-2xl hover:bg-red-100 transition-colors">
            <span className="text-lg">🚑</span>
            <span className="text-[10px] font-black text-red-600 leading-none">108</span>
          </a>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2 mt-3">
          <span className="pulse-dot" />
          <span className="text-xs font-semibold text-slate-400">
            {isHindi ? 'AI इंजन सक्रिय — 246K+ क्लिनिकल रिकॉर्ड' : 'AI Engine Active — 246K+ Clinical Records'}
          </span>
        </div>
      </div>

      {/* ── Last search quick-recheck ── */}
      {lastSearch && (
        <button
          onClick={() => setActivePage('search')}
          className="w-full mb-5 p-4 bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-2xl flex items-center gap-3 text-left hover:shadow-md hover:border-blue-200 transition-all group animate-card-2"
        >
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
            <Pill className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              {isHindi ? 'पिछली जांच' : 'Last checked'}
            </p>
            <p className="font-bold text-slate-800 text-sm truncate">{lastSearch}</p>
          </div>
          <div className="flex items-center gap-1 text-blue-500 text-xs font-bold flex-shrink-0">
            {isHindi ? 'फिर जांचें' : 'Re-check'}
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      )}

      {/* ── Profile Incomplete Nudge ── */}
      {completeness < 80 && (
        <button
          onClick={() => setActivePage('profile')}
          className="w-full mb-5 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center gap-4 text-left hover:shadow-lg transition-all group animate-card-2"
        >
          <div className="relative w-12 h-12 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="14" strokeWidth="3" stroke="rgba(255,255,255,0.3)" fill="none" />
              <circle
                cx="18" cy="18" r="14"
                strokeWidth="3"
                stroke="white"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${completeness * 0.88} 88`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-black text-white">{completeness}%</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm">
              {isHindi ? 'हेल्थ प्रोफाइल पूरी करें' : 'Complete your health profile'}
            </p>
            <p className="text-blue-200 text-xs mt-0.5 leading-snug">
              {isHindi ? 'बेहतर पर्सनलाइज्ड रिपोर्ट पाएं' : 'Get personalised safety warnings for your conditions'}
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-white/70 group-hover:translate-x-1 transition-transform flex-shrink-0" />
        </button>
      )}

      {/* ── Action Cards ── */}
      <div className="mb-3">
        <h2 className="section-label">{isHindi ? 'क्या करना है?' : 'What do you want to do?'}</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {ACTIVE_CARDS.map((card, i) => {
          const Icon = card.icon
          const animClass = `animate-card-${Math.min(i + 3, 6)}`
          return (
            <button
              key={card.id}
              onClick={() => setActivePage(card.id)}
              className={`relative text-left p-4 rounded-2xl border ${card.cardBg} ${card.border} hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group ${animClass}`}
            >
              {card.hot && (
                <span className="absolute top-2 right-2 text-[8px] font-black uppercase tracking-widest bg-blue-600 text-white px-1.5 py-0.5 rounded-full">
                  {isHindi ? 'मुख्य' : 'Main'}
                </span>
              )}
              <div className={`w-10 h-10 ${card.iconBg} rounded-xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-slate-800 text-xs mb-0.5 leading-tight">{card.title}</h3>
              <p className="text-slate-500 text-[10px] leading-snug">{card.desc}</p>
            </button>
          )
        })}
      </div>

      {/* ── Coming Soon ── */}
      <div className="mb-3">
        <h2 className="section-label">{isHindi ? '🚀 जल्द आ रहा है' : '🚀 Coming Soon'}</h2>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-8">
        {COMING_SOON.map((card, idx) => {
          const Icon = card.icon
          return (
            <div key={idx} className="p-3 rounded-2xl bg-white border border-slate-100 opacity-50 select-none cursor-not-allowed text-center">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-2">
                <Icon className="w-4 h-4 text-slate-400" />
              </div>
              <p className="font-bold text-slate-600 text-[10px] leading-tight">{isHindi ? card.titleHi : card.title}</p>
            </div>
          )
        })}
      </div>

      {/* ── Tips strip ── */}
      <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm mb-0.5">
              {isHindi ? 'प्रो टिप 💡' : 'Pro Tip 💡'}
            </p>
            <p className="text-blue-100 text-xs leading-relaxed">
              {isHindi
                ? '2 या अधिक दवाएं एक साथ जोड़ें — AI इंटरेक्शन और खुराक दोनों जांचेगा।'
                : 'Add 2+ medicines together — AI checks drug interactions AND dosage safety simultaneously.'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Disclaimer ── */}
      <p className="text-[10px] text-slate-400 text-center leading-relaxed px-2">
        <strong className="text-slate-500">Disclaimer:</strong>{' '}
        {isHindi
          ? 'AI Health Guardian केवल जानकारी के लिए है। डॉक्टर की सलाह का विकल्प नहीं।'
          : 'AI Health Guardian provides safety information only. Not a substitute for professional medical advice.'}
      </p>
    </div>
  )
}
