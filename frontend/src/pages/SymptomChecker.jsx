import React, { useState } from 'react'
import { useStore } from '../store/useStore'
import { Activity, AlertTriangle, Info, Loader2, X, ChevronRight, Search, CheckCircle2, AlertOctagon, ShieldCheck } from 'lucide-react'

const COMMON_SYMPTOMS = [
  { id: 'fever', en: 'Fever', hi: 'बुखार 🌡️' },
  { id: 'headache', en: 'Headache', hi: 'सिरदर्द' },
  { id: 'cough', en: 'Cough', hi: 'खांसी' },
  { id: 'sore_throat', en: 'Sore Throat', hi: 'गले में दर्द' },
  { id: 'body_ache', en: 'Body Ache', hi: 'शरीर में दर्द' },
  { id: 'fatigue', en: 'Fatigue / Weakness', hi: 'थकान / कमज़ोरी' },
  { id: 'nausea', en: 'Nausea', hi: 'मतली' },
  { id: 'vomiting', en: 'Vomiting', hi: 'उल्टी' },
  { id: 'diarrhea', en: 'Diarrhea', hi: 'दस्त' },
  { id: 'stomach_pain', en: 'Stomach Pain', hi: 'पेट दर्द' },
  { id: 'breathlessness', en: 'Breathlessness', hi: 'सांस फूलना' },
  { id: 'chest_pain', en: 'Chest Pain', hi: 'सीने में दर्द 🚨' },
  { id: 'joint_pain', en: 'Joint Pain', hi: 'जोड़ों में दर्द' },
  { id: 'back_pain', en: 'Back Pain', hi: 'कमर/पीठ दर्द' },
  { id: 'dizziness', en: 'Dizziness', hi: 'चक्कर आना' },
  { id: 'rash', en: 'Skin Rash', hi: 'त्वचा पर चकत्ते' },
  { id: 'itching', en: 'Itching', hi: 'खुजली' },
  { id: 'sweating', en: 'Sweating', hi: 'पसीना आना' },
  { id: 'loss_of_appetite', en: 'Loss of Appetite', hi: 'भूख न लगना' },
  { id: 'bloating', en: 'Bloating', hi: 'पेट फूलना' },
  { id: 'constipation', en: 'Constipation', hi: 'कब्ज़' },
  { id: 'fainting', en: 'Fainting', hi: 'बेहोशी 🚨' },
  { id: 'seizures', en: 'Seizures', hi: 'दौरे 🚨' },
  { id: 'numbness', en: 'Numbness/Tingling', hi: 'सुन्नपन' },
]

const SEVERITY_CONFIG = {
  'Emergency': { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800', badge: 'badge-red', icon: AlertOctagon },
  'Urgent Support': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', badge: 'badge-amber', icon: AlertTriangle },
  'High Care': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', badge: 'badge-blue', icon: Info },
}

export default function SymptomChecker() {
  const { profile } = useStore()
  const isHindi = profile?.language === 'hi'

  const [selectedSymptoms, setSelectedSymptoms] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const toggle = (id) => {
    setSelectedSymptoms(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 15 ? [...prev, id] : prev
    )
    setResult(null)
  }

  const filtered = search.trim()
    ? COMMON_SYMPTOMS.filter(s =>
        s.en.toLowerCase().includes(search.toLowerCase()) ||
        s.hi.includes(search))
    : COMMON_SYMPTOMS

  const analyze = async () => {
    if (!selectedSymptoms.length) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/symptoms/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: selectedSymptoms,
          age: profile?.age || null,
          gender: profile?.gender || null,
          diseases: profile?.diseases || [],
          allergies: profile?.allergies || [],
          currentMedicines: profile?.currentMedicines || [],
          language: profile?.language || 'en',
          personalized: !!(profile?.age || profile?.diseases?.length)
        })
      })
      if (!res.ok) throw new Error('Analysis failed')
      const data = await res.json()
      setResult(data)
    } catch {
      setError(isHindi
        ? 'सर्वर से कनेक्ट नहीं हो सका। कृपया बाद में कोशिश करें।'
        : 'Could not connect to server. Please try again.')
    }
    setLoading(false)
  }

  const reset = () => { setSelectedSymptoms([]); setResult(null); setError('') }

  return (
    <div className="page pb-32">
      {/* DISCLAIMER — always visible */}
      <div className="alert alert-caution mb-6 text-xs">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          <strong>{isHindi ? 'महत्वपूर्ण सूचना:' : 'Important Disclaimer:'}</strong>{' '}
          {isHindi
            ? 'यह टूल केवल जानकारी के लिए है। किसी भी बीमारी या दवा के लिए हमेशा डॉक्टर से मिलें। आपातकाल में 108 पर कॉल करें।'
            : 'This tool is for informational purposes only. Always consult a qualified doctor for diagnosis and treatment. In emergencies, call 108.'}
        </div>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-6 h-6 text-rose-500" />
          {isHindi ? 'लक्षण जांचकर्ता' : 'Symptom Checker'}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {isHindi ? 'अपने लक्षण चुनें — AI संभावित कारण और सलाह देगा' : 'Select your symptoms — AI will suggest possible causes and guidance'}
        </p>
      </div>

      {!result ? (
        <>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              className="inp pl-11 text-sm"
              placeholder={isHindi ? 'लक्षण खोजें...' : 'Search symptoms...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Selected chips */}
          {selectedSymptoms.length > 0 && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-2xl">
              <p className="section-label mb-2 text-rose-600">{selectedSymptoms.length} {isHindi ? 'चुने गए लक्षण' : 'selected'}</p>
              <div className="flex flex-wrap gap-2">
                {selectedSymptoms.map(id => {
                  const s = COMMON_SYMPTOMS.find(x => x.id === id)
                  return (
                    <div key={id} className="chip" style={{ background: '#fff1f2', borderColor: '#fecdd3', color: '#be123c' }}>
                      <span className="text-xs">{isHindi ? s?.hi : s?.en}</span>
                      <button onClick={() => toggle(id)} className="chip-remove" style={{ background: '#fecdd3', color: '#be123c' }}>
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Symptom Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
            {filtered.map(s => {
              const sel = selectedSymptoms.includes(s.id)
              const isEmergency = s.hi.includes('🚨')
              return (
                <button
                  key={s.id}
                  onClick={() => toggle(s.id)}
                  className={`px-3 py-2.5 rounded-xl text-left text-sm font-semibold border transition-all ${
                    sel
                      ? 'bg-rose-500 text-white border-rose-500 shadow-md'
                      : isEmergency
                      ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  {isHindi ? s.hi : s.en}
                </button>
              )
            })}
          </div>

          {error && (
            <div className="alert alert-caution mb-4 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" /> <span>{error}</span>
            </div>
          )}

          <button
            disabled={!selectedSymptoms.length || loading}
            onClick={analyze}
            className="btn-danger w-full btn-xl"
          >
            {loading
              ? <><Loader2 className="w-5 h-5 animate-spin" /> {isHindi ? 'विश्लेषण हो रहा है...' : 'Analyzing...'}</>
              : <><Activity className="w-5 h-5" /> {isHindi ? 'लक्षण विश्लेषण करें' : 'Analyze Symptoms'} <ChevronRight className="w-5 h-5" /></>
            }
          </button>
        </>
      ) : (
        /* ── RESULTS ── */
        <div className="space-y-4 animate-slide-up">
          {/* Risk badge */}
          <div className={`card text-center ${result.risk_level === 'danger' ? 'border-red-300 bg-red-50' : result.risk_level === 'caution' ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50'}`}>
            {result.risk_level === 'danger'
              ? <AlertOctagon className="w-8 h-8 text-red-500 mx-auto mb-2" />
              : result.risk_level === 'caution'
              ? <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              : <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
            }
            <div className={`text-2xl font-black mb-1 ${result.risk_level === 'danger' ? 'text-red-700' : result.risk_level === 'caution' ? 'text-amber-700' : 'text-green-700'}`}>
              {result.risk_score}/100
            </div>
            <p className="text-sm font-semibold text-slate-600">{isHindi ? 'जोखिम स्तर' : 'Risk Level'}</p>
          </div>

          {/* Personalized Alerts */}
          {result.personalized_alerts?.length > 0 && (
            <div className="alert alert-danger">
              <AlertOctagon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                {result.personalized_alerts.map((a, i) => <p key={i} className="text-xs font-semibold">{a}</p>)}
              </div>
            </div>
          )}

          {/* Possible Conditions */}
          {result.conditions?.length > 0 && (
            <div className="card">
              <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-500" />
                {isHindi ? 'संभावित कारण' : 'Possible Conditions'}
              </h3>
              <div className="space-y-2">
                {result.conditions.slice(0, 6).map((c, i) => {
                  const sev = SEVERITY_CONFIG[c.severity] || SEVERITY_CONFIG['High Care']
                  const SevIcon = sev.icon
                  return (
                    <div key={i} className={`p-3 rounded-xl border ${sev.bg} ${sev.border}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-bold text-sm ${sev.text}`}>{c.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`badge ${sev.badge} text-[9px]`}>{c.severity}</span>
                          <span className="text-xs font-black text-slate-600">{c.probability}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-white/60 rounded-full h-1.5">
                        <div className="h-full rounded-full bg-current opacity-40" style={{ width: `${c.probability}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Red Flags */}
          {result.red_flags?.length > 0 && (
            <div className="card border-red-200 bg-red-50">
              <h3 className="font-bold text-red-900 text-sm mb-2 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4" />
                {isHindi ? 'खतरनाक संकेत (तुरंत डॉक्टर से मिलें)' : 'Red Flags — See Doctor Immediately'}
              </h3>
              <ul className="space-y-1">
                {result.red_flags.slice(0, 5).map((f, i) => (
                  <li key={i} className="text-xs font-semibold text-red-700 flex gap-2">
                    <span className="text-red-400 flex-shrink-0">•</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* OTC / Safe Medicines hint */}
          {result.otc_medicines?.length > 0 && (
            <div className="card border-emerald-200 bg-emerald-50">
              <h3 className="font-bold text-emerald-900 text-sm mb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                {isHindi ? 'OTC सलाह (फार्मासिस्ट से पूछें)' : 'General OTC Guidance (Ask Pharmacist)'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.otc_medicines.slice(0, 4).map((m, i) => (
                  <span key={i} className="badge badge-green text-xs">{m}</span>
                ))}
              </div>
              <p className="text-[10px] text-emerald-700 mt-2 font-medium">
                {isHindi ? '⚠️ ये केवल सुझाव हैं। डॉक्टर/फार्मासिस्ट से पुष्टि करें।' : '⚠️ These are suggestions only. Always confirm with a pharmacist or doctor.'}
              </p>
            </div>
          )}

          {/* Medical Advice Banner */}
          <div className="card bg-slate-900 border-slate-800 text-center">
            <p className="text-white font-bold text-sm mb-1">👨‍⚕️ {isHindi ? 'डॉक्टर से मिलने की सलाह' : 'Medical Advice Required'}</p>
            <p className="text-slate-400 text-xs leading-relaxed">
              {isHindi
                ? 'उचित जांच और इलाज के लिए किसी योग्य डॉक्टर से ज़रूर मिलें।'
                : 'For proper diagnosis and treatment, please consult a qualified healthcare professional.'}
            </p>
          </div>

          <button onClick={reset} className="btn-secondary w-full">
            {isHindi ? 'नया लक्षण चेक करें' : 'Check Different Symptoms'}
          </button>
        </div>
      )}
    </div>
  )
}
