import React from 'react'
import { useStore } from '../store/useStore'
import {
  ShieldCheck, Search, Camera, Mic, Activity,
  ArrowRight, BadgeCheck, Zap, Heart, AlertTriangle, CheckCircle2
} from 'lucide-react'

const FEATURES = [
  {
    icon: Search,
    title: 'Medicine Safety Check',
    titleHi: 'दवा सुरक्षा जांच',
    desc: 'Check any medicine for interactions, contraindications, and risks instantly.',
    descHi: 'किसी भी दवा को जांचें — रिएक्शन, खतरे और सावधानियां।',
    color: 'from-blue-600 to-blue-700',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    page: 'search',
  },
  {
    icon: Camera,
    title: 'Strip OCR Scan',
    titleHi: 'स्ट्रिप स्कैन',
    desc: 'Scan medicine strips. AI reads name, dose, and expiry automatically.',
    descHi: 'दवा का पत्ता स्कैन करें। AI नाम, डोज़ और एक्सपायरी पढ़ेगा।',
    color: 'from-emerald-600 to-emerald-700',
    lightColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    page: 'scan',
  },
  {
    icon: Activity,
    title: 'Symptom Checker',
    titleHi: 'लक्षण जांचकर्ता',
    desc: 'Describe symptoms. Get AI-powered guidance based on 246K clinical records.',
    descHi: 'अपने लक्षण चुनें। 2.46 लाख रिकॉर्ड से जांच पाएं।',
    color: 'from-rose-500 to-rose-600',
    lightColor: 'bg-rose-50',
    textColor: 'text-rose-700',
    page: 'symptoms',
  },
  {
    icon: Mic,
    title: 'Hindi Voice Input',
    titleHi: 'हिंदी आवाज़ इनपुट',
    desc: 'Just speak the medicine name in Hindi. No typing needed.',
    descHi: 'हिंदी में दवा का नाम बोलें — टाइपिंग की ज़रूरत नहीं।',
    color: 'from-amber-500 to-amber-600',
    lightColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    page: 'voice',
  },
]

const STATS = [
  { val: '<5s',   label: 'Report Time',      labelHi: 'रिपोर्ट टाइम' },
  { val: '100%',  label: 'Always Free',      labelHi: 'हमेशा मुफ़्त' },
  { val: 'Hi+En', label: '2 Languages',      labelHi: '2 भाषाएं' },
]

const HOW_IT_WORKS = [
  { step: '01', icon: Search,      color: 'bg-blue-600',    title: 'Enter Medicine',   titleHi: 'दवा का नाम दें',   desc: 'Type, speak, or scan your medicine.', descHi: 'टाइप करें, बोलें, या स्कैन करें।' },
  { step: '02', icon: Zap,         color: 'bg-purple-600',  title: 'AI Analyzes',      titleHi: 'AI विश्लेषण',      desc: '5-step safety check in seconds.',     descHi: '5-चरणीय सुरक्षा जांच, सेकंड में।' },
  { step: '03', icon: ShieldCheck, color: 'bg-emerald-600', title: 'Get Your Report',  titleHi: 'रिपोर्ट पाएं',     desc: 'Safe / Caution / Dangerous verdict.',  descHi: 'Safe / Caution / Dangerous रिपोर्ट।' },
]

export default function Home() {
  const { setActivePage, profile } = useStore()
  const isHindi = profile?.language === 'hi'
  const T = (en, hi) => isHindi ? hi : en

  return (
    <div className="min-h-screen">

      {/* ══ HERO ══════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900" />
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(white 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#f8fafc] to-transparent" />

        <div className="relative max-w-5xl mx-auto px-5 pt-16 pb-28 text-center">

          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full px-4 py-2 mb-8 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-sm font-semibold text-white/90">
              {T("India's AI Medicine Safety Copilot", 'भारत का AI हेल्थ असिस्टेंट')}
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-5 leading-[1.1] tracking-tight animate-card-1">
            {T(
              <><span className="text-white">Know Your Medicine</span><br /><span className="text-yellow-300">Before You Take It.</span></>,
              <><span className="text-white">दवा लेने से पहले</span><br /><span className="text-yellow-300">AI से पूछें।</span></>
            )}
          </h1>

          <p className="text-base sm:text-lg text-blue-200 max-w-lg mx-auto mb-10 leading-relaxed animate-card-2">
            {T(
              'Type, scan, or speak a medicine name — get an AI safety report in under 5 seconds. Free forever.',
              'दवा का नाम लिखें, स्ट्रिप स्कैन करें, या हिंदी में बोलें — AI 5 सेकंड में सुरक्षा रिपोर्ट देगा।'
            )}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-12 animate-card-3">
            <button
              onClick={() => setActivePage('search')}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-white text-blue-700 font-black text-base px-8 py-4 rounded-2xl shadow-2xl shadow-blue-900/40 hover:-translate-y-1 hover:shadow-blue-900/50 transition-all"
            >
              <ShieldCheck className="w-5 h-5" />
              {T('Check a Medicine — Free', 'दवा जांचें — Free')}
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActivePage('scan')}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-white/15 backdrop-blur-sm border border-white/30 text-white font-bold text-base px-6 py-4 rounded-2xl hover:bg-white/25 transition-all"
            >
              <Camera className="w-5 h-5" />
              {T('Scan Strip', 'स्ट्रिप स्कैन')}
            </button>
          </div>

          {/* Stats row */}
          <div className="flex justify-center gap-4 sm:gap-8 flex-wrap animate-card-4">
            {STATS.map((s, i) => (
              <div key={i} className="text-center px-3">
                <div className="text-2xl sm:text-3xl font-black text-yellow-300">{s.val}</div>
                <div className="text-[10px] text-blue-300 font-bold uppercase tracking-widest mt-0.5">
                  {isHindi ? s.labelHi : s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ QUICK ACTIONS ═════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-5 -mt-10 mb-16 relative z-10">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Search, label: T('Search', 'खोजें'),     page: 'search', bg: 'from-blue-600 to-blue-800' },
            { icon: Camera, label: T('Scan Strip', 'स्कैन'), page: 'scan',   bg: 'from-emerald-500 to-emerald-700' },
            { icon: Mic,    label: T('Speak', 'बोलें'),      page: 'voice',  bg: 'from-amber-500 to-amber-700' },
          ].map(({ icon: Icon, label, page, bg }) => (
            <button
              key={page}
              onClick={() => setActivePage(page)}
              className={`bg-gradient-to-br ${bg} text-white rounded-2xl p-4 sm:p-5 text-center hover:-translate-y-1 hover:shadow-xl transition-all group shadow-lg`}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="text-xs sm:text-sm font-bold leading-tight block">{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ══ HOW IT WORKS ══════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-5 mb-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
            {T('How It Works', '3 आसान चरण')}
          </h2>
          <p className="text-slate-500 text-sm">
            {T('No registration. Just type and get results.', 'कोई रजिस्ट्रेशन नहीं — बस नाम लिखें और रिपोर्ट पाएं।')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {HOW_IT_WORKS.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.step} className="relative bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 ${s.color} rounded-2xl flex items-center justify-center mb-4 shadow-md`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="absolute top-5 right-5 text-5xl font-black text-slate-100 leading-none select-none">{s.step}</div>
                <h3 className="font-black text-slate-900 mb-2">{isHindi ? s.titleHi : s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{isHindi ? s.descHi : s.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ══ FEATURES ══════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-5 mb-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
            {T('Everything in One Place', 'सब कुछ एक जगह')}
          </h2>
          <p className="text-slate-500 text-sm">
            {T('Built for every Indian household', 'हर भारतीय परिवार के लिए बनाया गया')}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <button
                key={f.title}
                onClick={() => setActivePage(f.page)}
                className="group text-left bg-white border border-slate-100 rounded-3xl p-5 hover:border-slate-200 hover:shadow-md transition-all"
              >
                <div className="flex gap-4 items-start">
                  <div className={`bg-gradient-to-br ${f.color} w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-slate-900 text-sm mb-1">{isHindi ? f.titleHi : f.title}</h3>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>
                    <p className="text-slate-500 text-xs leading-relaxed">{isHindi ? f.descHi : f.desc}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* ══ VERDICT EXPLAINER ═════════════════════════ */}
      <section className="max-w-5xl mx-auto px-5 mb-16">
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <h2 className="font-black text-slate-900 text-lg mb-1">
            {T('What do the verdicts mean?', 'रिपोर्ट में क्या दिखेगा?')}
          </h2>
          <p className="text-slate-500 text-xs mb-5">
            {T('Every medicine check gives you one of three clear verdicts.', 'हर जांच में एक साफ़ नतीजा मिलता है।')}
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: CheckCircle2, label: T('SAFE', 'सुरक्षित'), sub: T('Generally safe to take', 'लेना सुरक्षित है'), bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', iconColor: 'text-emerald-600' },
              { icon: AlertTriangle, label: T('CAUTION', 'सावधानी'), sub: T('Take with care', 'सावधानी से लें'), bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', iconColor: 'text-amber-600' },
              { icon: AlertTriangle, label: T('DANGER', 'खतरनाक'), sub: T('Consult doctor', 'डॉक्टर से मिलें'), bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', iconColor: 'text-red-600' },
            ].map((v) => {
              const VIcon = v.icon
              return (
                <div key={v.label} className={`${v.bg} border ${v.border} rounded-2xl p-3 text-center`}>
                  <VIcon className={`w-6 h-6 ${v.iconColor} mx-auto mb-2`} />
                  <p className={`font-black text-xs ${v.text}`}>{v.label}</p>
                  <p className="text-slate-500 text-[10px] mt-0.5 leading-snug">{v.sub}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══ BOTTOM CTA ════════════════════════════════ */}
      <section className="bg-gradient-to-br from-blue-700 to-indigo-800 py-16 px-5 text-center">
        <div className="max-w-lg mx-auto">
          <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
            {T("Start Today — It's Free Forever", 'आज ही शुरू करें — बिल्कुल मुफ़्त')}
          </h2>
          <p className="text-blue-200 text-sm mb-8 leading-relaxed">
            {T(
              'No sign-up required. Type a medicine name and get your personalized safety report instantly.',
              'कोई रजिस्ट्रेशन नहीं। बस दवा का नाम लिखें और सुरक्षा रिपोर्ट पाएं।'
            )}
          </p>
          <button
            onClick={() => setActivePage('search')}
            className="inline-flex items-center gap-3 bg-white text-blue-700 font-black text-base px-8 py-4 rounded-2xl shadow-2xl hover:-translate-y-1 transition-all"
          >
            <ShieldCheck className="w-5 h-5" />
            {T('Check a Medicine', 'दवा जांचें')}
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="mt-6 flex items-center justify-center gap-6 text-blue-300 text-xs font-semibold flex-wrap">
            <span>✓ {T('Completely Free', 'बिल्कुल मुफ़्त')}</span>
            <span>✓ {T('No App Needed', 'कोई ऐप नहीं')}</span>
            <span>✓ {T('Hindi + English', 'हिंदी + English')}</span>
            <span>✓ {T('Voice Support', 'आवाज़ से जांच')}</span>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="text-center py-6 px-5 bg-slate-50 border-t border-slate-100">
        <p className="text-[10px] text-slate-400 max-w-2xl mx-auto leading-relaxed">
          <strong>Disclaimer:</strong> AI Health Guardian provides medicine safety information for educational purposes only.
          It is not a substitute for professional medical advice, diagnosis, or treatment.
          Always consult a qualified healthcare provider. Emergency: Call <strong>108</strong>.
        </p>
      </div>
    </div>
  )
}
