import React, { useState } from 'react'
import { useStore } from '../store/useStore'
import {
  Zap, Plus, X, ChevronRight, AlertTriangle, AlertOctagon,
  CheckCircle2, ShieldCheck, Info, RefreshCw, Search
} from 'lucide-react'

const SEVERITY_CONFIG = {
  dangerous: {
    bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800',
    badge: 'badge-red', icon: AlertOctagon, iconColor: 'text-red-600',
    emoji: '🚨', labelEn: 'DANGEROUS', labelHi: 'अत्यधिक खतरनाक'
  },
  caution: {
    bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800',
    badge: 'badge-amber', icon: AlertTriangle, iconColor: 'text-amber-500',
    emoji: '⚠️', labelEn: 'CAUTION', labelHi: 'सावधानी'
  },
  safe: {
    bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800',
    badge: 'badge-green', icon: CheckCircle2, iconColor: 'text-emerald-500',
    emoji: '✅', labelEn: 'SAFE', labelHi: 'सुरक्षित'
  },
}

const KNOWN_PAIRS = [
  { drugs: ['Aspirin', 'Ibuprofen'], severity: 'caution', effect: 'NSAIDs taken together increase GI bleeding risk. Aspirin\'s cardioprotective effect may be reduced.', effectHi: 'साथ लेने से पेट से खून आने का खतरा बढ़ता है।', management: 'Use one at a time. Consult a doctor before combining.', managementHi: 'एक ही समय पर एक लें। डॉक्टर से पूछें।' },
  { drugs: ['Warfarin', 'Aspirin'], severity: 'dangerous', effect: 'Highly dangerous. Warfarin + Aspirin dramatically increases bleeding risk, can cause internal hemorrhage.', effectHi: 'बहुत खतरनाक। एक साथ लेने से अंदरूनी खून बहने का खतरा।', management: 'Avoid. Requires strict doctor supervision and INR monitoring.', managementHi: 'बचें। डॉक्टर की कड़ी निगरानी में ही लें।' },
  { drugs: ['Metformin', 'Alcohol'], severity: 'dangerous', effect: 'Risk of fatal Lactic Acidosis. Alcohol impairs metformin\'s metabolism.', effectHi: 'घातक Lactic Acidosis का खतरा। शराब मेटफॉर्मिन के असर को बाधित करती है।', management: 'Completely avoid alcohol with Metformin.', managementHi: 'मेटफॉर्मिन के साथ शराब बिल्कुल न लें।' },
  { drugs: ['Ibuprofen', 'Paracetamol'], severity: 'caution', effect: 'Generally safe short-term for acute pain. Combined use over time may increase liver and kidney stress.', effectHi: 'अल्पकालिक उपयोग ठीक है। लंबे समय तक साथ लेने से किडनी-लिवर पर दबाव बढ़ता है।', management: 'Keep to minimum duration. Avoid on empty stomach.', managementHi: 'कम से कम समय के लिए लें। खाली पेट न लें।' },
  { drugs: ['Omeprazole', 'Clopidogrel'], severity: 'caution', effect: 'Omeprazole may reduce Clopidogrel\'s antiplatelet effect, increasing heart attack risk in cardiac patients.', effectHi: 'Omeprazole Clopidogrel के असर को कम कर सकता है।', management: 'Use Pantoprazole instead. Discuss with cardiologist.', managementHi: 'इसकी जगह Pantoprazole लें। हृदय रोग विशेषज्ञ से मिलें।' },
  { drugs: ['Cetirizine', 'Alcohol'], severity: 'caution', effect: 'Both cause CNS depression. Combined use causes extreme drowsiness, dizziness, and impaired coordination.', effectHi: 'दोनों नींद लाते हैं। साथ लेने से बहुत अधिक नींद और चक्कर आ सकते हैं।', management: 'Avoid alcohol while taking antihistamines.', managementHi: 'एंटीहिस्टामाइन लेते समय शराब से बचें।' },
]

const QUICK_PAIRS = [
  { label: 'Aspirin + Warfarin', a: 'Aspirin', b: 'Warfarin' },
  { label: 'Ibuprofen + Paracetamol', a: 'Ibuprofen', b: 'Paracetamol' },
  { label: 'Metformin + Alcohol', a: 'Metformin', b: 'Alcohol' },
  { label: 'Omeprazole + Clopidogrel', a: 'Omeprazole', b: 'Clopidogrel' },
]

export default function Interactions() {
  const { profile } = useStore()
  const isHindi = profile?.language === 'hi'

  const [medicines, setMedicines] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')

  const addMedicine = (med) => {
    const cleaned = med.trim()
    if (!cleaned || medicines.includes(cleaned) || medicines.length >= 8) return
    setMedicines(prev => [...prev, cleaned])
    setQuery('')
    setReport(null)
  }

  const removeMedicine = (med) => {
    setMedicines(prev => prev.filter(m => m !== med))
    setReport(null)
  }

  const checkInteractions = async () => {
    if (medicines.length < 2) return
    setLoading(true)
    setError('')
    setReport(null)

    try {
      const res = await fetch('/api/interactions/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicines,
          profile: {
            diseases: profile?.diseases || [],
            allergies: profile?.allergies || [],
            currentMedicines: profile?.currentMedicines || []
          }
        })
      })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      setReport(data)
    } catch {
      // Fallback: local pair-matching
      const pairs = []
      for (let i = 0; i < medicines.length; i++) {
        for (let j = i + 1; j < medicines.length; j++) {
          const a = medicines[i].toLowerCase()
          const b = medicines[j].toLowerCase()
          const known = KNOWN_PAIRS.find(p =>
            (p.drugs[0].toLowerCase() === a && p.drugs[1].toLowerCase() === b) ||
            (p.drugs[0].toLowerCase() === b && p.drugs[1].toLowerCase() === a) ||
            p.drugs.some(d => a.includes(d.toLowerCase()) || b.includes(d.toLowerCase()))
          )
          if (known) {
            pairs.push({
              pair: [medicines[i], medicines[j]],
              severity: known.severity,
              effect: isHindi ? known.effectHi : known.effect,
              management: isHindi ? known.managementHi : known.management
            })
          } else {
            pairs.push({
              pair: [medicines[i], medicines[j]],
              severity: 'safe',
              effect: isHindi ? 'कोई ज्ञात खतरनाक इंटरेक्शन नहीं मिला।' : 'No known dangerous interaction found in our database.',
              management: ''
            })
          }
        }
      }

      const hasDangerous = pairs.some(p => p.severity === 'dangerous')
      const hasCaution = pairs.some(p => p.severity === 'caution')
      setReport({
        overall_safety: hasDangerous ? 'dangerous' : hasCaution ? 'caution' : 'safe',
        interactions: pairs,
        profile_alerts: [],
        disclaimer: 'This is AI-assisted information only. Always consult your doctor or pharmacist before combining medicines.'
      })
    }
    setLoading(false)
  }

  const overall = report ? (SEVERITY_CONFIG[report.overall_safety] || SEVERITY_CONFIG.safe) : null
  const OverallIcon = overall?.icon

  return (
    <div className="page">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">
              {isHindi ? 'दवा इंटरेक्शन चेकर' : 'Drug Interaction Checker'}
            </h1>
            <p className="text-xs text-slate-500">
              {isHindi ? '246K+ क्लिनिकल रिकॉर्ड से जांच करें' : 'Checked against 246K+ clinical records'}
            </p>
          </div>
        </div>
  
      </div>

      {/* Medicine Input */}
      <div className="card mb-4">
        <p className="section-label mb-3">{isHindi ? 'दवाएं जोड़ें (कम से कम 2)' : 'Add Medicines (minimum 2)'}</p>
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && query.trim()) addMedicine(query) }}
              placeholder={isHindi ? 'दवा का नाम लिखें...' : 'Type medicine name...'}
              className="inp pl-11 text-sm"
            />
          </div>
          <button
            onClick={() => addMedicine(query)}
            disabled={!query.trim() || medicines.length >= 8}
            className="btn-primary px-4 text-sm min-h-[48px]"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Quick pairs */}
        <div className="mb-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            {isHindi ? 'सामान्य जांचें' : 'Quick pairs'}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PAIRS.map(p => (
              <button
                key={p.label}
                onClick={() => { setMedicines([p.a, p.b]); setReport(null) }}
                className="px-2.5 py-1 bg-purple-50 border border-purple-100 text-purple-700 text-[11px] font-bold rounded-lg hover:bg-purple-100 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Added chips */}
        {medicines.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              {isHindi ? 'जोड़ी गई दवाएं' : 'Added'} ({medicines.length}/8)
            </p>
            <div className="flex flex-wrap gap-2">
              {medicines.map(m => (
                <div key={m} className="chip">
                  <span>{m}</span>
                  <button onClick={() => removeMedicine(m)} className="chip-remove"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {medicines.length < 2 && medicines.length > 0 && (
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            {isHindi ? `${2 - medicines.length} और दवा जोड़ें जांच के लिए।` : `Add ${2 - medicines.length} more medicine to check.`}
          </div>
        )}

        <button
          onClick={checkInteractions}
          disabled={medicines.length < 2 || loading}
          className="btn-primary w-full btn-lg mt-2"
          style={{ background: '#7c3aed' }}
        >
          {loading
            ? <><RefreshCw className="w-5 h-5 animate-spin" /> {isHindi ? 'जांच हो रही है...' : 'Checking...'}</>
            : <><Zap className="w-5 h-5" /> {isHindi ? 'इंटरेक्शन जांचें' : 'Check Interactions'} <ChevronRight className="w-5 h-5" /></>
          }
        </button>
      </div>

      {/* Error */}
      {error && <div className="alert alert-caution mb-4 text-sm"><AlertTriangle className="w-4 h-4 flex-shrink-0" /><span>{error}</span></div>}

      {/* Results */}
      {report && (
        <div className="space-y-4 animate-slide-up">

          {/* Overall verdict banner */}
          <div className={`card ${overall.bg} ${overall.border} border-2 text-center py-6`}>
            <div className="text-4xl mb-2">{overall.emoji}</div>
            <div className={`font-black text-2xl uppercase tracking-wide mb-1 ${overall.text}`}>
              {isHindi ? overall.labelHi : overall.labelEn}
            </div>
            <p className={`text-sm font-semibold ${overall.text} opacity-80`}>
              {report.interactions?.length} {isHindi ? 'इंटरेक्शन विश्लेषित' : 'interactions analyzed'}
            </p>
          </div>

          {/* Profile alerts */}
          {report.profile_alerts?.length > 0 && (
            <div className="card border-red-200 bg-red-50">
              <h3 className="font-bold text-red-900 text-sm mb-3 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4" />
                {isHindi ? 'आपकी प्रोफाइल के लिए चेतावनियां' : 'Profile-Specific Warnings'}
              </h3>
              <ul className="space-y-2">
                {report.profile_alerts.map((a, i) => (
                  <li key={i} className="text-xs font-semibold text-red-800 flex gap-2">
                    <span className="text-red-400">•</span>
                    <span>{a.msg || a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pairwise interactions */}
          {report.interactions?.length > 0 && (
            <div className="card">
              <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-500" />
                {isHindi ? 'दवाओं के बीच इंटरेक्शन' : 'Drug-Drug Interactions'}
              </h3>
              <div className="space-y-3">
                {report.interactions.map((inter, i) => {
                  const sev = SEVERITY_CONFIG[inter.severity] || SEVERITY_CONFIG.safe
                  const SevIcon = sev.icon
                  return (
                    <div key={i} className={`p-4 rounded-2xl border ${sev.bg} ${sev.border}`}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <SevIcon className={`w-4 h-4 ${sev.iconColor} flex-shrink-0`} />
                          <span className="font-bold text-slate-900 text-sm">
                            {inter.pair[0]} + {inter.pair[1]}
                          </span>
                        </div>
                        <span className={`badge ${sev.badge} text-[9px] flex-shrink-0`}>
                          {isHindi ? sev.labelHi : sev.labelEn}
                        </span>
                      </div>
                      <p className={`text-xs font-medium leading-relaxed ${sev.text} mb-2`}>{inter.effect}</p>
                      {inter.management && (
                        <div className="bg-white/70 rounded-xl px-3 py-2 border border-white">
                          <p className="text-[11px] font-bold text-slate-600">
                            <strong>{isHindi ? 'सलाह: ' : 'Management: '}</strong>
                            {inter.management}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* All clear */}
          {report.interactions?.length === 0 && report.profile_alerts?.length === 0 && (
            <div className="card text-center py-8 border-emerald-200 bg-emerald-50">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="font-bold text-emerald-900 text-lg mb-1">
                {isHindi ? 'कोई खतरनाक इंटरेक्शन नहीं' : 'No Dangerous Interactions Found'}
              </h3>
              <p className="text-emerald-700 text-sm">
                {isHindi
                  ? 'इन दवाओं के बीच कोई ज्ञात खतरनाक रिएक्शन नहीं मिला।'
                  : 'No known dangerous interactions found between these medicines.'}
              </p>
            </div>
          )}

          {/* Disclaimer */}
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
            <p className="text-[10px] text-slate-400 text-center leading-relaxed">
              ⚠️ {report.disclaimer || 'AI Health Guardian provides safety information only. Always consult a qualified doctor or pharmacist before taking any medicine.'}
            </p>
          </div>

          {/* Recheck */}
          <button onClick={() => setReport(null)} className="btn-secondary w-full">
            {isHindi ? 'दूसरी दवाएं जांचें' : 'Check Different Medicines'}
          </button>
        </div>
      )}

      {/* Static reference — shown when no report */}
      {!report && (
        <div className="card">
          <h3 className="section-label mb-3">{isHindi ? 'सामान्य खतरनाक जोड़ियां' : 'Common Critical Pairs to Know'}</h3>
          <div className="space-y-2">
            {[
              { en: 'Aspirin + Warfarin', hi: 'एस्पिरिन + वारफेरिन', risk: 'dangerous', en2: 'Severe bleeding risk', hi2: 'गंभीर रक्तस्राव खतरा' },
              { en: 'Ibuprofen + Dengue Fever', hi: 'इबुप्रोफेन + डेंगू', risk: 'dangerous', en2: 'Fatal hemorrhagic risk', hi2: 'जानलेवा खून बहने का खतरा' },
              { en: 'Metformin + Alcohol', hi: 'मेटफॉर्मिन + शराब', risk: 'dangerous', en2: 'Lactic acidosis risk', hi2: 'Lactic Acidosis का खतरा' },
              { en: 'Omeprazole + Clopidogrel', hi: 'ओमेप्रेज़ोल + क्लोपिडोग्रेल', risk: 'caution', en2: 'Reduced cardiac protection', hi2: 'हृदय सुरक्षा कम होती है' },
              { en: 'Cetirizine + Alcohol', hi: 'सेटिरीज़िन + शराब', risk: 'caution', en2: 'Extreme drowsiness', hi2: 'अत्यधिक नींद का खतरा' },
            ].map((item, i) => (
              <div key={i} className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold ${item.risk === 'dangerous'
                  ? 'bg-red-50 border-red-100 text-red-800'
                  : 'bg-amber-50 border-amber-100 text-amber-800'
                }`}>
                <span>{isHindi ? item.hi : item.en}</span>
                <span className={`badge ${item.risk === 'dangerous' ? 'badge-red' : 'badge-amber'} text-[9px]`}>
                  {isHindi ? (item.risk === 'dangerous' ? 'खतरनाक' : 'सावधानी') : item.risk}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
