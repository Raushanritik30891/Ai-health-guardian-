import React, { useState, useEffect } from 'react'
import { useStore } from '../../store/useStore'
import { Pill, Heart, AlertTriangle, Leaf, Sparkles, CheckCircle2, RefreshCw, XCircle } from 'lucide-react'

const STEPS = [
  { id: 1, en: 'Reading medicine data',            hi: 'दवा की जानकारी पढ़ी जा रही है',        icon: Pill,          colorClass: 'text-blue-600',    bgClass: 'bg-blue-100',    ringClass: 'ring-blue-400/40' },
  { id: 2, en: 'Checking your health profile',     hi: 'आपकी प्रोफाइल जांची जा रही है',        icon: Heart,         colorClass: 'text-rose-500',    bgClass: 'bg-rose-100',    ringClass: 'ring-rose-400/40' },
  { id: 3, en: 'Looking for dangerous interactions',hi: 'खतरनाक रिएक्शन ढूँढे जा रहे हैं',     icon: AlertTriangle, colorClass: 'text-amber-600',   bgClass: 'bg-amber-100',   ringClass: 'ring-amber-400/40' },
  { id: 4, en: 'Finding safer alternatives',        hi: 'सुरक्षित विकल्प खोजे जा रहे हैं',     icon: Leaf,          colorClass: 'text-emerald-600', bgClass: 'bg-emerald-100', ringClass: 'ring-emerald-400/40' },
  { id: 5, en: 'Preparing your safety report',      hi: 'आपकी रिपोर्ट तैयार हो रही है',         icon: Sparkles,      colorClass: 'text-purple-600',  bgClass: 'bg-purple-100',  ringClass: 'ring-purple-400/40' },
]

export default function Analyzing() {
  const { setActivePage, profile, analysis, setAnalysis, sessionProfile } = useStore()
  const isHindi = profile?.language === 'hi'

  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!analysis.medicines || analysis.medicines.length === 0) {
      setActivePage('dashboard')
      return
    }

    // Animate through steps while API call happens
    const stepTimers = []
    STEPS.forEach((_, i) => {
      stepTimers.push(setTimeout(() => setCurrentStep(i + 1), (i + 1) * 1400))
    })

    // Make real API call
    const callAPI = async () => {
      try {
        // Priority: 1) analysis.profileData (from QuickForm - synchronous) 
        //           2) saved profile (logged-in user)  
        //           3) sessionProfile (fallback)
        let profileData = null

        // 1. Check if QuickForm data was passed directly in analysis object (no race condition)
        if (analysis.profileData) {
          profileData = {
            age: analysis.profileData.age ? Number(analysis.profileData.age) : null,
            isPregnant: analysis.profileData.isPregnant || false,
            diseases: analysis.profileData.diseases || [],
            allergies: analysis.profileData.allergies || [],
            currentMedicines: typeof analysis.profileData.currentMedicines === 'string'
              ? analysis.profileData.currentMedicines.split(',').map(m => m.trim()).filter(Boolean)
              : (analysis.profileData.currentMedicines || [])
          }
        }
        // 2. Use saved profile if logged-in user has filled it
        else if (profile?.age || profile?.diseases?.length > 0 || profile?.allergies?.length > 0) {
          profileData = {
            age: profile.age ? Number(profile.age) : null,
            isPregnant: profile.isPregnant || false,
            diseases: profile.diseases || [],
            allergies: profile.allergies || [],
            currentMedicines: Array.isArray(profile.currentMedicines)
              ? profile.currentMedicines
              : profile.currentMedicines ? [profile.currentMedicines] : []
          }
        }
        // 3. Fall back to sessionProfile (guest partial data)
        else if (sessionProfile?.age || sessionProfile?.diseases?.length > 0) {
          profileData = {
            age: sessionProfile.age ? Number(sessionProfile.age) : null,
            isPregnant: sessionProfile.isPregnant || false,
            diseases: sessionProfile.diseases || [],
            allergies: sessionProfile.allergies || [],
            currentMedicines: Array.isArray(sessionProfile.currentMedicines)
              ? sessionProfile.currentMedicines
              : sessionProfile.currentMedicines ? [sessionProfile.currentMedicines] : []
          }
        }

        console.log('[Analyze] profileData being sent:', profileData)
        console.log('[Analyze] isPersonalized:', !!profileData)

        const body = {
          medicines: analysis.medicines,
          profile: profileData,
          ocrData: analysis.ocrData || null,
          schedule: analysis.medicationSchedule || []
        }

        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData?.detail?.message || errorData?.detail || 'Analysis failed')
        }

        const result = await response.json()

        // Wait until we've shown at least 3 steps
        const startTime = Date.now()
        const remainingTime = Math.max(0, 4200 - (Date.now() - startTime))
        await new Promise(resolve => setTimeout(resolve, remainingTime))

        setCurrentStep(5)
        await new Promise(resolve => setTimeout(resolve, 700))

        setAnalysis({ result: result.data, isAnalyzing: false, error: null })
        setActivePage('result')

      } catch (err) {
        console.error('Analysis API error:', err)
        setError(err.message || 'Something went wrong')
        setAnalysis({ isAnalyzing: false, error: err.message })
      }
    }

    // Start API call immediately alongside animation
    callAPI()

    return () => stepTimers.forEach(t => clearTimeout(t))
  }, [])

  if (error) {
    return (
      <div className="page flex items-center justify-center min-h-screen p-6">
        <div className="card w-full max-w-sm text-center bg-white rounded-3xl p-8 border border-slate-100 shadow-2xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">{isHindi ? 'विश्लेषण विफल रहा' : 'Analysis Failed'}</h2>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            {isHindi ? 'सर्वर से कनेक्ट नहीं हो सका। कृपया जांचें कि इंटरनेट ठीक है और फिर से प्रयास करें।' : `Could not connect to server: ${error}`}
          </p>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {isHindi ? 'फिर से प्रयास करें' : 'Try Again'}
            </button>
            <button
              onClick={() => setActivePage('search')}
              className="btn-secondary w-full py-3"
            >
              {isHindi ? 'वापस जाएं' : 'Go Back'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl shadow-slate-200/50 p-8 md:p-10">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" style={{ animationDuration: '2s' }} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isHindi ? 'दवा की जांच हो रही है' : 'Analyzing Medicine'}
            </h1>
            <p className="text-slate-500 text-sm mt-2 leading-relaxed">
              {isHindi
                ? 'कृपया प्रतीक्षा करें — हम आपकी दवा सुरक्षा जांच रहे हैं...'
                : 'Please wait while we run your medicine safety check...'}
            </p>

            {/* Medicines being checked */}
            {analysis.medicines?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
                {analysis.medicines.map(m => (
                  <span key={m} className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2.5 py-1 rounded-full">{m}</span>
                ))}
              </div>
            )}
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {STEPS.map((step) => {
              const done    = currentStep > step.id
              const active  = currentStep === step.id
              const waiting = currentStep < step.id
              const Icon    = step.icon

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-4 transition-all duration-500 ${waiting ? 'opacity-25' : 'opacity-100'}`}
                >
                  {/* Icon circle */}
                  <div className={`relative w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-500
                    ${done    ? 'bg-emerald-500'             : ''}
                    ${active  ? `${step.bgClass} ring-2 ${step.ringClass} ring-offset-2 animate-pulse` : ''}
                    ${waiting ? 'bg-slate-100'               : ''}
                  `}>
                    {done
                      ? <CheckCircle2 className="w-5 h-5 text-white" />
                      : <Icon className={`w-5 h-5 ${active ? step.colorClass : 'text-slate-400'}`} />
                    }
                  </div>

                  {/* Label */}
                  <div className="flex-1">
                    <p className={`font-semibold text-sm transition-colors ${
                      active ? 'text-slate-900' : done ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      {isHindi ? step.hi : step.en}
                    </p>
                    {active && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wide ml-0.5">
                          {isHindi ? 'जांचा जा रहा है' : 'In progress'}
                        </span>
                      </div>
                    )}
                  </div>

                  {done && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  )}
                </div>
              )
            })}
          </div>

          {/* Bottom disclaimer */}
          <p className="text-center text-[10px] text-slate-300 font-medium mt-8 leading-relaxed">
            {isHindi
              ? 'AI-पावर्ड विश्लेषण। चिकित्सा सलाह का विकल्प नहीं।'
              : 'AI-powered analysis. Not a substitute for medical advice.'}
          </p>
        </div>
      </div>
    </div>
  )
}
