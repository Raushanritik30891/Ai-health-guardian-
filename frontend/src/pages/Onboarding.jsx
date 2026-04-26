import React, { useState } from 'react'
import { useStore } from '../store/useStore'
import { ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react'

const STEPS = [
  {
    key: 'age',
    en: { q: "What's your age?", sub: 'Helps adjust dosage warnings for elderly and children.' },
    hi: { q: 'आपकी उम्र क्या है?', sub: 'बुज़ुर्गों और बच्चों के लिए दवा चेतावनी एडजस्ट करने में मदद करता है।' },
    type: 'number'
  },
  {
    key: 'gender',
    en: { q: 'Your gender?', sub: 'Certain medicines affect men and women differently.' },
    hi: { q: 'आपका लिंग?', sub: 'कुछ दवाएं पुरुष और महिला पर अलग तरह असर करती हैं।' },
    type: 'choice',
    choices: [
      { value: 'male', en: 'Male', hi: 'पुरुष' },
      { value: 'female', en: 'Female', hi: 'महिला' },
      { value: 'other', en: 'Other / Prefer not to say', hi: 'अन्य / बताना नहीं' },
    ]
  },
  {
    key: 'diseases',
    en: { q: 'Any existing health conditions?', sub: 'We\'ll alert you about medicines contraindicated for your conditions.' },
    hi: { q: 'कोई पुरानी बीमारी है?', sub: 'हम आपको आपकी बीमारियों के आधार पर खतरनाक दवाओं के बारे में बताएंगे।' },
    type: 'multi',
    options: [
      { id: 'diabetes', en: 'Diabetes', hi: 'मधुमेह' },
      { id: 'hypertension', en: 'High Blood Pressure', hi: 'हाई BP' },
      { id: 'kidney_disease', en: 'Kidney Disease', hi: 'किडनी रोग' },
      { id: 'liver_disease', en: 'Liver Disease', hi: 'लिवर रोग' },
      { id: 'asthma', en: 'Asthma', hi: 'दमा' },
      { id: 'heart_disease', en: 'Heart Disease', hi: 'हृदय रोग' },
      { id: 'ulcer', en: 'Ulcer', hi: 'अल्सर' },
      { id: 'thyroid', en: 'Thyroid', hi: 'थायरॉइड' },
    ]
  },
  {
    key: 'allergies',
    en: { q: 'Any medicine allergies?', sub: 'We\'ll remove allergic medicines from recommendations and warn you.' },
    hi: { q: 'कोई दवा एलर्जी है?', sub: 'हम एलर्जिक दवाएं रिकमेंडेशन से हटाकर आपको चेतावनी देंगे।' },
    type: 'multi',
    options: [
      { id: 'penicillin', en: 'Penicillin', hi: 'पेनिसिलिन' },
      { id: 'nsaids', en: 'NSAIDs (Ibuprofen, Aspirin)', hi: 'NSAIDs' },
      { id: 'sulfa', en: 'Sulfa / Sulfonamides', hi: 'सल्फा' },
      { id: 'iodine', en: 'Iodine', hi: 'आयोडीन' },
    ]
  },
]

export default function Onboarding() {
  const { setActivePage, profile, setProfile } = useStore()
  const isHindi = profile?.language === 'hi'

  const [step, setStep] = useState(0)
  const [data, setData] = useState({
    age: '',
    gender: '',
    diseases: [],
    allergies: []
  })

  const current = STEPS[step]
  const text = isHindi ? current.hi : current.en
  const isLast = step === STEPS.length - 1

  const toggleMulti = (field, id) => {
    setData(d => ({
      ...d,
      [field]: d[field].includes(id)
        ? d[field].filter(x => x !== id)
        : [...d[field], id]
    }))
  }

  const next = () => {
    if (isLast) finish()
    else setStep(s => s + 1)
  }

  const finish = () => {
    setProfile({
      age: parseInt(data.age) || null,
      gender: data.gender,
      diseases: data.diseases,
      allergies: data.allergies,
    })
    setActivePage('dashboard')
  }

  const canNext = () => {
    if (current.type === 'number') return !data.age || parseInt(data.age) > 0
    if (current.type === 'choice') return !!data.gender
    return true // multi-select can be empty
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-blue-50 via-white to-slate-50">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/30">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-1">
            {isHindi ? 'स्वास्थ्य प्रोफाइल बनाएं' : 'Build Your Health Profile'}
          </h1>
          <p className="text-slate-500 text-sm">
            {isHindi
              ? 'यह जानकारी आपकी दवा जांच को पर्सनलाइज़ करती है।'
              : 'This helps us give you more accurate, personalized medicine safety checks.'}
          </p>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${
                i < step ? 'bg-emerald-500' : i === step ? 'bg-blue-600' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Step Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl shadow-slate-200/50 p-7 mb-4 animate-fade">
          <div className="mb-6">
            <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">
              {isHindi ? `चरण ${step + 1} / ${STEPS.length}` : `Step ${step + 1} of ${STEPS.length}`}
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">{text.q}</h2>
            <p className="text-slate-500 text-sm leading-relaxed">{text.sub}</p>
          </div>

          {/* Input */}
          {current.type === 'number' && (
            <input
              type="number" min="1" max="120" autoFocus
              value={data.age} onChange={e => setData(d => ({ ...d, age: e.target.value }))}
              placeholder={isHindi ? 'उम्र (वर्षों में)' : 'Age in years'}
              className="inp text-center text-3xl font-black h-20"
            />
          )}

          {current.type === 'choice' && (
            <div className="grid gap-2">
              {current.choices.map(c => (
                <button
                  key={c.value}
                  onClick={() => setData(d => ({ ...d, gender: c.value }))}
                  className={`w-full py-3.5 px-5 rounded-2xl font-bold text-base border-2 text-left transition-all flex items-center justify-between ${
                    data.gender === c.value
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <span>{isHindi ? c.hi : c.en}</span>
                  {data.gender === c.value && <CheckCircle2 className="w-5 h-5" />}
                </button>
              ))}
            </div>
          )}

          {current.type === 'multi' && (
            <div className="flex flex-wrap gap-2">
              {current.options.map(o => {
                const sel = data[current.key]?.includes(o.id)
                return (
                  <button
                    key={o.id}
                    onClick={() => toggleMulti(current.key, o.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                      sel
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    {isHindi ? o.hi : o.en}
                    {sel && ' ✓'}
                  </button>
                )
              })}
              <p className="w-full text-xs text-slate-400 mt-1">
                {isHindi ? '(कोई नहीं चुनें अगर लागू नहीं होता)' : '(Leave empty if none apply)'}
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="btn-secondary min-h-[52px] px-5 text-sm"
            >
              ← {isHindi ? 'पीछे' : 'Back'}
            </button>
          )}
          <button
            onClick={next}
            className="btn-primary flex-1 min-h-[52px]"
          >
            {isLast
              ? <><CheckCircle2 className="w-5 h-5" /> {isHindi ? 'प्रोफाइल सेव करें' : 'Save Profile'}</>
              : <>{isHindi ? 'अगला' : 'Next'} <ArrowRight className="w-5 h-5" /></>
            }
          </button>
        </div>

        {/* Skip */}
        <button
          onClick={finish}
          className="w-full mt-4 text-slate-400 hover:text-slate-600 text-sm font-semibold text-center transition-colors"
        >
          {isHindi ? 'अभी छोड़ें, बाद में प्रोफाइल में जोड़ें →' : 'Skip for now, add later in Profile →'}
        </button>
      </div>
    </div>
  )
}
