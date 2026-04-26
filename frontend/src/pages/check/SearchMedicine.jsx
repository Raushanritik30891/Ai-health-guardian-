import React, { useState, useRef } from 'react'
import { useStore } from '../../store/useStore'
import {
  Search, Mic, Plus, X, ChevronRight, AlertCircle, Loader2,
  Hash, Clock, ShieldCheck
} from 'lucide-react'


// Quick 5-question form for guests
function QuickQuestionForm({ onSubmit, onSkip, isHindi }) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState({
    age: '',
    isPregnant: false,
    diseases: [],
    allergies: [],
    currentMedicines: ''
  })

  const DISEASES = ['diabetes', 'hypertension', 'kidney_disease', 'liver_disease', 'asthma', 'heart_disease', 'ulcer', 'thyroid']
  const DISEASE_LABELS = {
    diabetes: 'Diabetes', hypertension: 'High BP', kidney_disease: 'Kidney Disease',
    liver_disease: 'Liver Disease', asthma: 'Asthma', heart_disease: 'Heart Disease',
    ulcer: 'Ulcer', thyroid: 'Thyroid'
  }
  const DISEASE_LABELS_HI = {
    diabetes: 'मधुमेह', hypertension: 'हाई BP', kidney_disease: 'किडनी रोग',
    liver_disease: 'लिवर रोग', asthma: 'दमा', heart_disease: 'हृदय रोग',
    ulcer: 'अल्सर', thyroid: 'थायरॉइड'
  }
  const ALLERGIES = ['penicillin', 'nsaids', 'aspirin', 'sulfa', 'iodine']
  const ALLERGY_LABELS = {
    penicillin: 'Penicillin', nsaids: 'NSAIDs', aspirin: 'Aspirin', sulfa: 'Sulfa', iodine: 'Iodine'
  }

  const toggleItem = (list, item) =>
    list.includes(item) ? list.filter(x => x !== item) : [...list, item]

  const steps = [
    {
      q: isHindi ? 'आपकी उम्र क्या है?' : 'How old are you?',
      content: (
        <input
          type="number" min="1" max="120"
          value={data.age}
          onChange={e => setData({ ...data, age: e.target.value })}
          placeholder={isHindi ? 'उम्र (वर्ष में)' : 'Age in years'}
          className="inp text-lg font-bold text-center"
          autoFocus
        />
      )
    },
    {
      q: isHindi ? 'क्या आप प्रेगनेंट हैं?' : 'Are you pregnant?',
      content: (
        <div className="grid grid-cols-2 gap-3">
          {[{ val: true, label: isHindi ? 'हाँ' : 'Yes' }, { val: false, label: isHindi ? 'नहीं' : 'No' }].map(opt => (
            <button
              key={String(opt.val)}
              onClick={() => setData({ ...data, isPregnant: opt.val })}
              className={`py-4 rounded-2xl font-bold text-lg border-2 transition-all ${data.isPregnant === opt.val ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )
    },
    {
      q: isHindi ? 'कोई बीमारी है?' : 'Any existing conditions?',
      content: (
        <div className="flex flex-wrap gap-2">
          {DISEASES.map(d => (
            <button
              key={d}
              onClick={() => setData({ ...data, diseases: toggleItem(data.diseases, d) })}
              className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${data.diseases.includes(d) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
            >
              {isHindi ? DISEASE_LABELS_HI[d] : DISEASE_LABELS[d]}
            </button>
          ))}
        </div>
      )
    },
    {
      q: isHindi ? 'कोई दवा से एलर्जी है?' : 'Any medicine allergies?',
      content: (
        <div className="flex flex-wrap gap-2">
          {ALLERGIES.map(a => (
            <button
              key={a}
              onClick={() => setData({ ...data, allergies: toggleItem(data.allergies, a) })}
              className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${data.allergies.includes(a) ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-600 border-slate-200 hover:border-red-300'}`}
            >
              {ALLERGY_LABELS[a]}
            </button>
          ))}
        </div>
      )
    },
    {
      q: isHindi ? 'अभी कोई दवा ले रहे हैं?' : 'Currently taking any medicine?',
      content: (
        <input
          type="text"
          value={data.currentMedicines}
          onChange={e => setData({ ...data, currentMedicines: e.target.value })}
          placeholder={isHindi ? 'दवा के नाम, कॉमा से अलग करें' : 'Medicine names, comma separated'}
          className="inp"
        />
      )
    }
  ]

  const currentStep = steps[step]

  const handleNext = () => {
    if (step < steps.length - 1) setStep(s => s + 1)
    else onSubmit(data)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onSkip}>
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-slate-900">{isHindi ? 'Check For Me (पर्सनलाइज़्ड जांच)' : 'Check For Me'}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{isHindi ? 'आपकी मेडिकल कंडीशन के अनुसार जांच' : 'Personalized conditions check for accurate safety'}</p>
          </div>
          <button onClick={onSkip} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5 mb-6">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full flex-1 transition-all ${i <= step ? 'bg-blue-600' : 'bg-slate-200'}`} />
          ))}
        </div>

        {/* Question */}
        <p className="font-semibold text-slate-800 mb-4">{currentStep.q}</p>
        <div className="mb-6">{currentStep.content}</div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onSkip} className="btn-secondary flex-1 text-sm min-h-[44px]">
            {isHindi ? 'छोड़ें' : 'Skip'}
          </button>
          <button onClick={handleNext} className="btn-primary flex-[2] text-sm min-h-[44px]">
            {step === steps.length - 1 ? (isHindi ? 'जांच शुरू करें' : 'Start Check') : (isHindi ? 'अगला' : 'Next')}
          </button>
        </div>
      </div>
    </div>
  )
}



// Common doses lookup for auto-prefill
const COMMON_DOSES = {
  'dolo 650': 650, 'paracetamol': 500, 'crocin': 500,'dolo': 650,
  'brufen': 400, 'ibuprofen': 400, 'combiflam': 400,
  'ecosprin': 75, 'aspirin': 75, 'disprin': 300,
  'thyronorm': 50, 'eltroxin': 50, 'levothyroxine': 50,
  'shelcal': 500, 'calcimax': 500, 'calcium': 500,
  'orofer': 100, 'ferrous': 200, 'iron': 100,
  'metformin': 500, 'glycomet': 500,
  'pantop': 40, 'pan': 40, 'pantoprazole': 40,
  'azithral': 500, 'azithromycin': 500,
  'atorvastatin': 10, 'lipitor': 10,
  'cetirizine': 10, 'alex': 5,
  'mox': 500, 'amoxicillin': 500,
}

function getCommonDose(medName) {
  const key = medName.toLowerCase().trim()
  for (const [k, v] of Object.entries(COMMON_DOSES)) {
    if (key.includes(k) || k.includes(key.split(' ')[0])) return v
  }
  return 500
}

// Dose-only form — collects mg per tablet for dosage safety check
function ScheduleForm({ medicines, onBack, onComplete, isHindi }) {
  const [schedule, setSchedule] = useState(
    medicines.map(m => ({ medicine: m, time: '08:00', dose_mg: getCommonDose(m) }))
  )

  const update = (i, val) => {
    const next = [...schedule]
    next[i].dose_mg = val
    setSchedule(next)
  }

  return (
    <div className="animate-slide-up pb-32">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-slate-400 font-bold text-sm flex items-center gap-1 hover:text-slate-700 transition-colors">
          ← {isHindi ? 'वापस' : 'Back'}
        </button>
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
          <Hash className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-black text-blue-700 uppercase tracking-wider">
            {isHindi ? 'खुराक बताएं' : 'Step 2: Enter Dose'}
          </span>
        </div>
      </div>

      {/* Info strip */}
      <div className="mb-5 p-3.5 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3 items-start">
        <span className="text-xl">⚖️</span>
        <div>
          <p className="text-xs font-bold text-blue-800 mb-0.5">
            {isHindi ? 'खुराक क्यों ज़रूरी है?' : 'Why enter dose?'}
          </p>
          <p className="text-[11px] text-blue-700 leading-relaxed">
            {isHindi
              ? 'ज़रूरत से ज़्यादा खुराक (जैसे 5000mg Paracetamol रोज़) Liver को नुकसान पहुंचा सकती है। हम आपकी खुराक की सुरक्षा जांच करेंगे।'
              : 'Too much of a medicine (e.g. 5000mg Paracetamol/day) can harm your liver. We check your daily dose against safe limits.'}
          </p>
        </div>
      </div>

      {/* Dose Cards */}
      <div className="space-y-3 mb-6">
        {schedule.map((entry, i) => (
          <div key={entry.medicine} className="card p-4 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center justify-center text-xs font-black">
                  {i + 1}
                </div>
                <p className="font-bold text-slate-800 text-sm">{entry.medicine}</p>
              </div>
              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {entry.dose_mg}mg
              </span>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1.5">
                <Hash className="w-3 h-3" />
                {isHindi ? 'एक गोली में कितने mg?' : 'How many mg per tablet?'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="5000"
                  value={entry.dose_mg}
                  onChange={e => update(i, Number(e.target.value))}
                  className="inp text-sm font-bold bg-slate-50 border-slate-200 h-11 px-3 pr-12 w-full"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">MG</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* What we check */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { icon: '⚖️', title: isHindi ? 'खुराक सुरक्षा' : 'Dosage Safety', desc: isHindi ? 'अधिकतम सीमा जांच' : 'Daily limit check' },
          { icon: '🎯', title: isHindi ? 'विश्वास स्कोर' : 'Confidence', desc: isHindi ? 'स्रोत गुणवत्ता' : 'Source quality' },
        ].map((f, i) => (
          <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
            <div className="text-xl mb-1">{f.icon}</div>
            <p className="text-[10px] font-black text-slate-700">{f.title}</p>
            <p className="text-[9px] text-slate-400">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="fixed bottom-[64px] md:bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-100 z-50">
        <div className="max-w-[480px] mx-auto">
          <button
            onClick={() => onComplete(schedule)}
            className="btn-primary w-full h-14 text-base font-black uppercase tracking-widest shadow-xl shadow-blue-500/20"
          >
            <ShieldCheck className="w-5 h-5" />
            {isHindi ? 'सुरक्षा जांच शुरू करें' : 'Run Safety Analysis'}
            <ChevronRight className="w-5 h-5" />
          </button>
          <p className="text-center text-[10px] text-slate-400 mt-2">
            {isHindi ? 'खुराक + ड्रग इंटरेक्शन — सब एक साथ चेक होगा' : 'Dosage + Drug Interactions — checked together'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SearchMedicine() {
  const { setActivePage, profile, setAnalysis, setSessionProfile, user, analysis } = useStore()
  const isHindi = profile?.language === 'hi'

  const [flowStep, setFlowStep] = useState('search') // 'search' | 'schedule'

  const [query, setQuery] = useState('')
  const [medicines, setMedicines] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [searchResultsRich, setSearchResultsRich] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showQuickForm, setShowQuickForm] = useState(false)
  const inputRef = useRef(null)

  // Real API Search
  React.useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        // Correct endpoint: /api/analyze/search (mounted under /api/analyze router)
        const res = await fetch(`/api/analyze/search?q=${encodeURIComponent(q)}`)
        if (res.ok) {
          const data = await res.json()
          const items = data.data || data.results || []
          // Show "BrandName (GenericName)" in dropdown for clarity
          const names = items
            .map(r => r.brandName || r.genericName)
            .filter(Boolean)
            .filter(n => !medicines.includes(n))
          setSearchResults(names)
          // Also store rich results for tooltip display
          setSearchResultsRich(items.filter(r => !medicines.includes(r.brandName || r.genericName)))
        }
      } catch (err) {
        console.error('Search API error:', err)
      } finally {
        setIsSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, medicines])


  const addMedicine = (med) => {
    if (medicines.length >= 10 || medicines.includes(med)) return
    setMedicines(prev => [...prev, med])
    setQuery('')
    inputRef.current?.focus()
  }

  const addCustom = () => {
    const q = query.trim()
    if (!q || medicines.includes(q)) return
    addMedicine(q)
  }

  const removeMedicine = (med) => setMedicines(prev => prev.filter(m => m !== med))

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (searchResults.length > 0) addMedicine(searchResults[0])
      else if (query.trim()) addCustom()
    }
  }

  const startAnalysis = (profileData = null, finalSchedule = null) => {
    if (medicines.length === 0) return
    // Store profileData directly in analysis so Analyzing.jsx reads it synchronously (no race condition)
    if (profileData) setSessionProfile(profileData)

    setAnalysis({
      medicines,
      medicationSchedule: finalSchedule || medicines.map(m => ({ medicine: m, time: '08:00', dose_mg: getCommonDose(m) })),
      profileData: profileData || null,  // ← pass profile directly in analysis object
      isAnalyzing: true,
      ocrData: null
    })
    setActivePage('analyzing')
  }

  const handleAnalyze = () => {
    if (medicines.length === 0) return
    // Auto-fill default doses — skip the Enter Dose step entirely
    const autoSchedule = medicines.map(m => ({ medicine: m, time: '08:00', dose_mg: getCommonDose(m) }))
    const hasEnoughProfile = user || profile?.age || profile?.diseases?.length > 0
    if (hasEnoughProfile) {
      startAnalysis(null, autoSchedule)
    } else {
      setTempSchedule(autoSchedule)
      setShowQuickForm(true)
    }
  }

  const [tempSchedule, setTempSchedule] = useState(null)

  return (
    <div className="page pb-32">
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => setActivePage('dashboard')} className="text-sm text-slate-400 hover:text-slate-600 font-semibold mb-4 flex items-center gap-1 group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          {isHindi ? 'डैशबोर्ड पर वापस' : 'Back to Dashboard'}
        </button>
        <h1 className="text-2xl font-bold text-slate-900">{isHindi ? 'दवा खोजें' : 'Search Medicine'}</h1>
        <p className="text-slate-500 text-sm mt-1">
          {isHindi ? 'सुरक्षा जांच के लिए 1–10 दवाएं जोड़ें' : 'Add up to 10 medicines to check for safety and interactions'}
        </p>
      </div>

      {/* Step 1: Search */}
      {flowStep === 'search' && (
        <div className="animate-fade-in">
          {/* Search Card */}
          <div className="card mb-4 relative z-20">
            {/* Input Row */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isHindi ? 'दवा का नाम टाइप करें...' : 'Type medicine name... e.g. Dolo 650'}
                  className="inp pl-12 pr-4 text-base"
                  autoFocus
                />

                {/* Dropdown */}
                {(isSearching || searchResults.length > 0 || query.trim()) && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-slide-down">
                    {isSearching ? (
                      <div className="p-4 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Searching...
                      </div>
                    ) : (
                      <>
                      {searchResults.map((med, idx) => {
                          const rich = searchResultsRich[idx]
                          return (
                            <button
                              key={med}
                              onMouseDown={() => addMedicine(med)}
                              className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-slate-50 last:border-0 group transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-bold text-slate-800 group-hover:text-blue-700">{med}</p>
                                  {rich?.genericName && rich.genericName !== med && (
                                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                      {rich.genericName}{rich.strength ? ` · ${rich.strength}` : ''}
                                    </p>
                                  )}
                                </div>
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ml-2 flex-shrink-0 ${
                                  rich?.otc ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {rich?.otc ? 'OTC' : 'Rx'}
                                </span>
                              </div>
                            </button>
                          )
                        })}
                        {query.trim() && !searchResults.find(m => m.toLowerCase() === query.trim().toLowerCase()) && (
                          <button
                            onMouseDown={addCustom}
                            className="w-full text-left px-4 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50 flex items-center gap-2 border-t border-slate-100"
                          >
                            <Plus className="w-4 h-4" />
                            {isHindi ? `"${query}" जोड़ें` : `Add "${query}"`}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Voice button */}
              <button
                onClick={() => setActivePage('voice')}
                className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center hover:bg-amber-100 transition-colors flex-shrink-0"
                title={isHindi ? 'हिंदी में बोलें' : 'Speak in Hindi'}
              >
                <Mic className="w-5 h-5" />
              </button>
            </div>

            {/* Added medicines chips */}
            {medicines.length > 0 && (
              <div className="mt-5 pt-5 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="section-label">{isHindi ? 'जोड़ी गई दवाएं' : 'Added Medicines'}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${medicines.length >= 10 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                    {medicines.length}/10
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {medicines.map(med => (
                    <div key={med} className="chip">
                      <span>{med}</span>
                      <button onClick={() => removeMedicine(med)} className="chip-remove">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interaction + dosage badges */}
            {medicines.length >= 1 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {medicines.length >= 2 && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {isHindi ? 'इंटरेक्शन चेक ON' : 'Interaction check ON'}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {isHindi ? 'खुराक सुरक्षा जांच' : 'Dosage safety check'}
                </div>
              </div>
            )}
          </div>

          {/* Recent Searches hint */}
          {medicines.length === 0 && (
            <div className="card">
              <p className="section-label mb-3">{isHindi ? 'सुझाई गई दवाएं' : 'Quick Search'}</p>
              <div className="flex flex-wrap gap-2">
                {['Dolo 650', 'Brufen 400', 'Pantop 40', 'Ecosprin 75', 'Mox 500', 'Cetirizine 10mg'].map(med => (
                  <button
                    key={med}
                    onClick={() => addMedicine(med)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                  >
                    + {med}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bottom CTA */}
          <div className="fixed bottom-[64px] md:bottom-0 left-0 right-0 p-4 bg-white/85 backdrop-blur-md border-t border-slate-200 z-30">
            <div className="max-w-[820px] mx-auto flex items-center gap-3">
              <button
                disabled={medicines.length === 0}
                onClick={handleAnalyze}
                className="btn-primary btn-xl flex-1 shadow-xl shadow-blue-600/30"
              >
                <ShieldCheck className="w-6 h-6" />
                {isHindi ? 'सुरक्षा जांचें' : 'Check Safety'}
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Schedule */}
      {flowStep === 'schedule' && (
        <ScheduleForm
          medicines={medicines}
          isHindi={isHindi}
          onBack={() => setFlowStep('search')}
          onComplete={handleScheduleComplete}
        />
      )}

      {/* Quick Form Modal */}
      {showQuickForm && (
        <QuickQuestionForm
          isHindi={isHindi}
          onSubmit={(data) => {
            setShowQuickForm(false)
            startAnalysis(data, tempSchedule)
          }}
          onSkip={() => {
            setShowQuickForm(false)
            startAnalysis(null, tempSchedule) // ← pass tempSchedule even on skip
          }}
        />
      )}
    </div>
  )
}
