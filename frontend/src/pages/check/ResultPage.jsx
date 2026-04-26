import React, { useState, useCallback } from 'react'
import axios from 'axios'
import { useStore } from '../../store/useStore'
import {
  ShieldCheck, AlertTriangle, AlertOctagon, Share2, ArrowLeft, Pill,
  Volume2, UserPlus, StopCircle, CheckCircle2, X, RefreshCw,
  TrendingDown, IndianRupee, Heart, Stethoscope, Activity,
  ExternalLink, Target, Star, Info, Sparkles, Loader2
} from 'lucide-react'

const VC = {
  safe: {
    bg: 'bg-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-200',
    text: 'text-emerald-900', sub: 'text-emerald-700',
    label: 'SAFE', labelHi: 'SAFE', Icon: CheckCircle2
  },
  caution: {
    bg: 'bg-amber-500', light: 'bg-amber-50', border: 'border-amber-200',
    text: 'text-amber-900', sub: 'text-amber-700',
    label: 'CAUTION', labelHi: 'CAUTION', Icon: AlertTriangle
  },
  dangerous: {
    bg: 'bg-red-600', light: 'bg-red-50', border: 'border-red-200',
    text: 'text-red-900', sub: 'text-red-700',
    label: 'DANGEROUS', labelHi: 'DANGEROUS', Icon: AlertOctagon
  }
}

function computeOutcomeLocal(med, userConditions) {
  const conditions = userConditions.trim().toLowerCase()
  if (!conditions) return null

  const alerts = []
  const positives = []
  let verdict = 'safe'

  const has = (word) => conditions.includes(word)
  const gen = (med.genericName || '').toLowerCase()

  if (has('dengue') && (gen.includes('ibuprofen') || gen.includes('aspirin') || gen.includes('nsaid'))) {
    alerts.push({ level: 'critical', text: '🚨 CRITICAL: You have Dengue. NSAIDs can cause severe internal bleeding. DO NOT TAKE.' })
    verdict = 'avoid'
  }
  if ((has('liver') || has('hepatitis')) && gen.includes('paracetamol')) {
    alerts.push({ level: 'danger', text: '⚠️ Liver disease detected. Limit Paracetamol. Consult doctor.' })
    if (verdict === 'safe') verdict = 'caution'
  }
  if ((has('kidney') || has('ckd')) && (gen.includes('ibuprofen') || gen.includes('nsaid') || gen.includes('metformin'))) {
    alerts.push({ level: 'danger', text: '🚫 Kidney disease detected. This medicine can be harmful. Avoid.' })
    if (verdict !== 'avoid') verdict = 'caution'
  }
  if ((has('ulcer') || has('stomach') || has('gerd')) && (gen.includes('ibuprofen') || gen.includes('aspirin'))) {
    alerts.push({ level: 'warning', text: '⚠️ Stomach/Ulcer issue detected. This NSAID can irritate stomach lining.' })
    if (verdict === 'safe') verdict = 'caution'
  }
  if ((has('penicillin') || has('amoxicillin allergy')) && gen.includes('amoxicillin')) {
    alerts.push({ level: 'critical', text: '🚨 Penicillin allergy detected. Risk of anaphylaxis. DO NOT TAKE.' })
    verdict = 'avoid'
  }
  if (has('asthma') && (gen.includes('ibuprofen') || gen.includes('aspirin'))) {
    alerts.push({ level: 'danger', text: '🚫 Asthma detected. NSAIDs can trigger asthma attacks.' })
    if (verdict !== 'avoid') verdict = 'caution'
  }
  if ((has('diabetes') || has('sugar')) && gen.includes('metformin')) {
    positives.push('✅ Metformin is suitable for treating your condition.')
  }
  if ((has('heart') || has('hypertension') || has('bp')) && gen.includes('ibuprofen')) {
    alerts.push({ level: 'warning', text: '⚠️ Heart/BP condition detected. Ibuprofen can raise blood pressure.' })
    if (verdict === 'safe') verdict = 'caution'
  }
  if (has('pregnancy') || has('pregnant')) {
    if (med.pregnancySafe === false) {
      alerts.push({ level: 'critical', text: '🚨 UNSAFE during pregnancy! Avoid this medicine.' })
      verdict = 'avoid'
    } else if (med.pregnancySafe === true) {
      positives.push('✅ Generally considered safe during pregnancy.')
    } else {
      alerts.push({ level: 'warning', text: '⚠️ Please consult your doctor before taking this during pregnancy.' })
      if (verdict === 'safe') verdict = 'caution'
    }
  }

  if (alerts.length === 0 && positives.length === 0) {
     positives.push('✅ No immediate critical conflicts detected for your specific inputs, but always consult a doctor.')
  }

  return { alerts, positives, verdict }
}

function useTTS() {
  const [playing, setPlaying] = useState(null)
  const speak = useCallback((text, lang, key) => {
    if (!('speechSynthesis' in window)) return
    if (playing === key) { window.speechSynthesis.cancel(); setPlaying(null); return }
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang === 'hi' ? 'hi-IN' : 'en-IN'
    u.rate = 0.9
    u.onend = () => setPlaying(null)
    u.onerror = () => setPlaying(null)
    setPlaying(key)
    window.speechSynthesis.speak(u)
  }, [playing])
  return { playing, speak }
}

function TTSBtn({ text, lang, ttsKey, playing, speak, className = '' }) {
  const on = playing === ttsKey
  if (!text) return null
  return (
    <button
      onClick={() => speak(text, lang, ttsKey)}
      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex-shrink-0 ${on ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600'} ${className}`}
    >
      {on ? <StopCircle className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
      {on ? 'Stop' : 'Listen'}
    </button>
  )
}

function ConfidenceBadge({ confidence, isHi }) {
  if (!confidence) return null
  const lvl = confidence.level || 'Medium'
  const pct = confidence.percentage || 75
  const clr = { High: 'text-emerald-700 bg-emerald-50 border-emerald-200', Medium: 'text-amber-700 bg-amber-50 border-amber-200', Low: 'text-red-700 bg-red-50 border-red-200' }
  const stars = { High: 3, Medium: 2, Low: 1 }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${clr[lvl] || clr.Medium}`}>
      <Target className="w-3 h-3" />
      {pct}% {isHi ? 'Vishwas' : 'Confidence'}
      <span className="flex gap-0.5">{[1,2,3].map(i => <Star key={i} className={`w-2.5 h-2.5 ${i <= (stars[lvl]||2) ? 'fill-current' : 'opacity-20'}`} />)}</span>
    </span>
  )
}

function SectionLabel({ children }) {
  return <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">{children}</p>
}

function ExplanationBlock({ en, hi, isHi, lang, playing, speak, medName }) {
  const text = isHi ? (hi || en) : (en || hi)
  if (!text) return null
  return (
    <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50 p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          {isHi ? 'AI Saral Vivaran' : 'AI Plain Explanation'}
        </p>
        <TTSBtn text={text} lang={lang} ttsKey={`exp-${medName}`} playing={playing} speak={speak} />
      </div>
      <p className="text-sm text-indigo-900 font-medium leading-relaxed">{text}</p>
    </div>
  )
}

function DosageBlock({ dosageInfo, isHi }) {
  if (!dosageInfo) return null
  const d = dosageInfo
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 space-y-2">
      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
        {isHi ? 'Khurak ki Jankari' : 'Dosage Guide'}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {d.usual_single_dose && (
          <div className="bg-white rounded-lg p-2 border border-blue-100">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">{isHi ? 'Ek Goli' : 'Per Tablet'}</p>
            <p className="text-xs font-bold text-slate-800">{d.usual_single_dose}</p>
          </div>
        )}
        {d.frequency && (
          <div className="bg-white rounded-lg p-2 border border-blue-100">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">{isHi ? 'Kitni Baar' : 'How Often'}</p>
            <p className="text-xs font-bold text-slate-800">{d.frequency}</p>
          </div>
        )}
      </div>
      {d.max_daily_dose && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[9px] font-black text-amber-700 uppercase">{isHi ? 'Din Mein Adhiktam' : 'Max per day'}</p>
            <p className="text-xs font-bold text-amber-900">{d.max_daily_dose}</p>
          </div>
        </div>
      )}
      {d.special_risk_groups?.length > 0 && (
        <div>
          <p className="text-[9px] font-black text-red-400 uppercase mb-1">{isHi ? 'Inke Liye Savdhani' : 'Extra Care Needed For'}</p>
          <div className="flex flex-wrap gap-1">
            {d.special_risk_groups.slice(0,4).map((g,i) => (
              <span key={i} className="bg-red-50 text-red-700 text-[9px] font-semibold px-2 py-0.5 rounded-full border border-red-100">{g}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MedicineCard({ med, idx, isHi, lang, playing, speak }) {
  const [open, setOpen] = useState(true)
  const [showPersonalized, setShowPersonalized] = useState(false)
  const [profileData, setProfileData] = useState({
    age: '', gender: 'Male', pregnant: false, conditions: '', allergies: ''
  })
  const [outcome, setOutcome] = useState(null)
  const [loading, setLoading] = useState(false)

  const ttsTxt = `${med.brandName}. Uses: ${med.uses?.join(', ')}.`
  
  const handleCheck = async () => {
    setLoading(true)
    setOutcome(null)
    try {
      const res = await axios.post('/api/scanner/personalized-check', {
        medicine_data: med,
        user_profile: profileData,
        language: isHi ? 'hi' : 'en'
      })
      if (res.data.success) {
        setOutcome(res.data.outcome)
      } else {
        // Fallback to local if Gemini fails
        setOutcome(computeOutcomeLocal(med, `${profileData.conditions} ${profileData.allergies} ${profileData.pregnant ? 'pregnant' : ''}`))
      }
    } catch (error) {
      console.error('Personalized check error:', error)
      setOutcome(computeOutcomeLocal(med, `${profileData.conditions} ${profileData.allergies} ${profileData.pregnant ? 'pregnant' : ''}`))
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
      <button className="w-full text-left bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center gap-3" onClick={() => setOpen(o => !o)}>
        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0"><Pill className="w-5 h-5 text-white" /></div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-white text-base leading-tight truncate">{med.brandName}</p>
          <p className="text-blue-200 text-xs font-medium truncate">{med.genericName}{med.strength ? ` - ${med.strength}` : ''}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${med.prescriptionRequired ? 'bg-amber-300 text-amber-900' : 'bg-emerald-300 text-emerald-900'}`}>{med.prescriptionRequired ? 'Rx' : 'OTC'}</span>
          <span className="text-white/70 font-bold text-base w-5 text-center">{open ? '-' : '+'}</span>
        </div>
      </button>
      {open && (
        <div className="p-4 space-y-4">
          <ExplanationBlock en={med.explanationEn} hi={med.explanationHi} isHi={isHi} lang={lang} playing={playing} speak={speak} medName={med.brandName} />
          <DosageBlock dosageInfo={med.dosageInfo} isHi={isHi} />
          {med.uses?.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">{isHi ? 'Kis Kaam Aati Hai' : 'What It Treats'}</p>
              <div className="flex flex-wrap gap-1.5">{med.uses.map((u,i) => <span key={i} className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full">{u}</span>)}</div>
            </div>
          )}
          {med.sideEffects?.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Side Effects</p>
              <div className="flex flex-wrap gap-1.5">{med.sideEffects.map((s,i) => <span key={i} className="bg-amber-50 border border-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full">{s}</span>)}</div>
            </div>
          )}
          {med.contraindications?.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2">{isHi ? 'Inhe Nahi Lena Chahiye' : 'Do NOT Take If You Have'}</p>
              <div className="flex flex-wrap gap-1.5">{med.contraindications.map((c,i) => <span key={i} className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-1 rounded-full">{c}</span>)}</div>
            </div>
          )}
          {(med.liverRisk || med.kidneyRisk) && (
            <div className="grid grid-cols-2 gap-2">
              {med.liverRisk && <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Liver</p><p className="text-[11px] text-slate-700 font-semibold leading-snug">{med.liverRisk}</p></div>}
              {med.kidneyRisk && <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Kidney</p><p className="text-[11px] text-slate-700 font-semibold leading-snug">{med.kidneyRisk}</p></div>}
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Heart className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase">Pregnancy</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${med.pregnancySafe===true?'bg-emerald-100 text-emerald-700':med.pregnancySafe===false?'bg-red-100 text-red-700':'bg-slate-100 text-slate-500'}`}>
                {med.pregnancySafe===true?'Safe':med.pregnancySafe===false?'Avoid':'Ask Doctor'}
              </span>
            </div>
            <TTSBtn text={ttsTxt} lang={lang} ttsKey={`med-${idx}`} playing={playing} speak={speak} />
          </div>

          <button
            onClick={() => setShowPersonalized(s => !s)}
            className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <Target className="w-4 h-4" />
            {isHi ? 'मेरे लिए जाँचें (Check For ME)' : 'Check For ME (Personalized Check)'}
          </button>

          {showPersonalized && (
            <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-xl animate-fade-in space-y-4">
              <div className="space-y-3">
                <p className="text-sm font-black text-blue-900 border-b border-blue-200 pb-2 mb-3">
                  {isHi ? 'व्यक्तिगत सुरक्षा जाँच (Personalized Safety Check)' : 'Personalized Safety Check'}
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-blue-800 uppercase mb-1 block">{isHi ? 'उम्र (Age)' : 'Age'}</label>
                    <input type="number" value={profileData.age} onChange={e => setProfileData({...profileData, age: e.target.value})} className="w-full text-sm p-2 rounded-lg border border-blue-200" placeholder="e.g. 35" disabled={loading} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-blue-800 uppercase mb-1 block">{isHi ? 'लिंग (Gender)' : 'Gender'}</label>
                    <select value={profileData.gender} onChange={e => setProfileData({...profileData, gender: e.target.value})} className="w-full text-sm p-2 rounded-lg border border-blue-200 bg-white" disabled={loading}>
                      <option value="Male">{isHi ? 'पुरुष' : 'Male'}</option>
                      <option value="Female">{isHi ? 'महिला' : 'Female'}</option>
                      <option value="Other">{isHi ? 'अन्य' : 'Other'}</option>
                    </select>
                  </div>
                </div>

                {profileData.gender === 'Female' && (
                  <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-blue-200">
                    <input type="checkbox" id={`preg-${idx}`} checked={profileData.pregnant} onChange={e => setProfileData({...profileData, pregnant: e.target.checked})} disabled={loading} className="w-4 h-4 text-blue-600 rounded" />
                    <label htmlFor={`preg-${idx}`} className="text-xs font-bold text-slate-700">{isHi ? 'क्या आप गर्भवती हैं या स्तनपान करा रही हैं?' : 'Are you pregnant or breastfeeding?'}</label>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-blue-800 uppercase mb-1 block">{isHi ? 'बीमारियां (Health Conditions)' : 'Health Conditions'}</label>
                  <input type="text" value={profileData.conditions} onChange={e => setProfileData({...profileData, conditions: e.target.value})} className="w-full text-sm p-2 rounded-lg border border-blue-200" placeholder={isHi ? "जैसे: मधुमेह, ब्लड प्रेशर..." : "e.g. Diabetes, Asthma, Liver..."} disabled={loading} />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-blue-800 uppercase mb-1 block">{isHi ? 'दवाइयों से एलर्जी (Allergies)' : 'Allergies'}</label>
                  <input type="text" value={profileData.allergies} onChange={e => setProfileData({...profileData, allergies: e.target.value})} className="w-full text-sm p-2 rounded-lg border border-blue-200" placeholder={isHi ? "जैसे: पेनिसिलिन..." : "e.g. Penicillin, NSAIDs..."} disabled={loading} />
                </div>
              </div>

              <button
                onClick={handleCheck}
                disabled={loading}
                className="w-full mt-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-black py-3 rounded-xl disabled:opacity-70 transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-900/20"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? (isHi ? 'डेटाबेस से AI जाँच कर रहा है...' : 'AI scanning dataset...') : (isHi ? 'AI रिपोर्ट बनाएं (Generate)' : 'Generate AI Report')}
              </button>
              
              {outcome && (
                <div className="mt-4 p-4 bg-white rounded-xl border border-blue-100 shadow-sm space-y-3">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                    <span className="text-3xl">{outcome.verdict === 'safe' ? '✅' : outcome.verdict === 'caution' ? '⚠️' : '🚨'}</span>
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase">{isHi ? 'AI निष्कर्ष' : 'AI Conclusion'}</div>
                      <span className={`font-black text-lg ${outcome.verdict === 'safe' ? 'text-emerald-700' : outcome.verdict === 'caution' ? 'text-amber-700' : 'text-red-700'}`}>
                        {outcome.verdict.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  {outcome.explanation && (
                    <div className="flex gap-2 pt-2 pb-2">
                      <div className="text-sm font-medium text-slate-700 leading-relaxed flex-1">
                        {outcome.explanation}
                      </div>
                      <div className="flex-shrink-0 pt-0.5">
                        <TTSBtn 
                          text={outcome.explanation} 
                          lang={lang} 
                          ttsKey={`personalized-tts-${idx}`} 
                          playing={playing} 
                          speak={speak} 
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2 pt-1 border-t border-slate-100 mt-2">
                    {outcome.alerts?.map((a, i) => (
                      <div key={i} className="text-xs font-bold p-3 rounded-lg bg-red-50 text-red-800 border border-red-100 flex items-start gap-2 leading-relaxed">
                        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <span>{a.text || a}</span>
                      </div>
                    ))}
                    {outcome.positives?.map((p, i) => {
                      const text = typeof p === 'string' ? p : p.text
                      return (
                        <div key={i} className="text-xs font-bold p-3 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-start gap-2 leading-relaxed">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span>{text}</span>
                        </div>
                      )
                    })}
                  </div>
                  
                  <div className="text-[9px] text-center font-bold text-slate-400 uppercase tracking-widest pt-2">
                    {isHi ? 'डेटाबेस के आधार पर AI रिपोर्ट' : 'Dataset-backed AI Report'}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DosageExceededAlert({ violations, isHi, lang, playing, speak }) {
  if (!violations?.length) return null
  const ttsText = violations.map(v => `${v.generic}: ${v.total}mg taken. Daily limit is ${v.limit}mg.`).join(' ')
  return (
    <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-black text-red-800 text-sm flex items-center gap-2"><AlertOctagon className="w-4 h-4 text-red-600 flex-shrink-0" />{isHi ? 'Khurak Seema Paar Ho Gai!' : 'Dosage Limit Exceeded!'}</h3>
        <TTSBtn text={ttsText} lang={lang} ttsKey="dosage-alert" playing={playing} speak={speak} />
      </div>
      {violations.map((v,i) => (
        <div key={i} className="bg-white rounded-xl border border-red-200 p-3 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <p className="font-black text-red-900 text-sm">{v.generic}</p>
            <span className="text-[10px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{v.total}mg / {v.limit}mg limit</span>
          </div>
          <div className="h-2.5 bg-red-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-amber-400 to-red-600 rounded-full" style={{width:`${Math.min((v.total/v.limit)*100,100)}%`}} /></div>
          <p className="text-xs text-red-700 font-medium leading-relaxed">{isHi?(v.warning_hindi||v.warning):v.warning}</p>
        </div>
      ))}
    </div>
  )
}

export default function ResultPage() {
  const { setActivePage, profile, analysis } = useStore()
  const data = analysis?.result
  const { playing, speak } = useTTS()
  const [lang, setLang] = useState(profile?.language || 'en')
  const isHi = lang === 'hi'
  const T = (en, hi) => isHi ? hi : en

  React.useEffect(() => {
    const handleRead = () => {
      if (!data) return
      const textToRead = `${isHi ? (data.explanationHindi || data.explanation) : data.explanation}. ${data.nextAction ? (isHi ? (data.nextActionHindi || data.nextAction) : data.nextAction) : ''}`
      speak(textToRead, lang, 'full-page')
    }
    window.addEventListener('ahg-read-page', handleRead)
    return () => window.removeEventListener('ahg-read-page', handleRead)
  }, [data, isHi, lang, speak])

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center max-w-sm w-full">
          <AlertOctagon className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="font-bold text-slate-800 text-lg mb-2">{T('No Result Found', 'Koi Data Nahi')}</h2>
          <p className="text-slate-500 text-sm mb-5">{T('Please search for a medicine first.', 'Pehle dawa khojen.')}</p>
          <button onClick={() => setActivePage('search')} className="btn-primary w-full">{T('Search Medicine', 'Dawa Khojen')}</button>
        </div>
      </div>
    )
  }

  const vc = VC[data.verdict] || VC.caution
  const VIcon = vc.Icon
  const circumference = 2 * Math.PI * 40
  const strokeOffset = circumference - (data.riskScore / 100) * circumference
  const gaugeColor = data.riskScore >= 71 ? '#dc2626' : data.riskScore >= 31 ? '#d97706' : '#16a34a'
  const pricesList = Array.isArray(data.prices) ? data.prices : data.prices && typeof data.prices === 'object' ? Object.values(data.prices).flat() : []
  const jaAlts = data.alternatives?.filter(a => a.janAushadhi) || []
  const brandAlts = data.alternatives?.filter(a => !a.janAushadhi) || []
  const hasProfileWarnings = data.isPersonalized && (data.diseaseWarnings?.length > 0 || data.allergyWarnings?.length > 0 || data.pregnancyWarning || data.pregnancyWarnings?.length > 0)

  const handleShare = async () => {
    const text = `AI Health Guardian\nMedicines: ${data.medicines?.join(', ')}\nVerdict: ${data.verdict?.toUpperCase()}\nRisk: ${data.riskScore}/100\n${data.explanation}`
    if (navigator.share) { try { await navigator.share({ title: 'Medicine Safety', text }) } catch (_) {} }
    else { navigator.clipboard?.writeText(text) }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <div className={`${vc.bg} text-white px-4 pb-16 relative overflow-hidden`}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/10" />
        </div>
        <div className="relative flex items-center justify-between pt-5 pb-5">
          <button onClick={() => setActivePage('search')} className="flex items-center gap-1 text-white/80 hover:text-white text-sm font-semibold"><ArrowLeft className="w-4 h-4" /> {T('Back', 'Wapas')}</button>
          <div className="flex items-center gap-2">
            <button onClick={() => setLang(isHi ? 'en' : 'hi')} className="bg-white/20 hover:bg-white/30 text-white text-xs font-black px-3 py-1.5 rounded-full">{isHi ? 'EN' : 'HI'}</button>
            <button onClick={handleShare} className="bg-white/20 hover:bg-white/30 text-white p-1.5 rounded-full"><Share2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
        <div className="relative text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3"><VIcon className="w-8 h-8 text-white" /></div>
          <h1 className="text-3xl font-black uppercase tracking-widest mb-2 leading-none">{isHi ? vc.labelHi : vc.label}</h1>
          {data.explanation && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm font-semibold max-w-sm mx-auto leading-snug opacity-90 px-2">{isHi ? (data.explanationHindi || data.explanation) : data.explanation}</p>
              <TTSBtn text={isHi ? (data.explanationHindi || data.explanation) : data.explanation} lang={lang} ttsKey="hero" playing={playing} speak={speak} className="!bg-white/20 !text-white hover:!bg-white/30" />
            </div>
          )}
          <div className="flex flex-wrap gap-2 justify-center mt-4">{data.medicines?.map(m => <span key={m} className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">{m}</span>)}</div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-3 -mt-6 space-y-4">
        <div className="flex justify-center">
          {data.isPersonalized ? (
            <div className="flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-md">
              <ShieldCheck className="w-3.5 h-3.5" />
              {isHi ? `${profile?.name || 'Aap'} ke liye Personalized Report` : `Personalized for ${profile?.name || 'You'}`}
            </div>
          ) : (
            <button onClick={() => setActivePage('auth')} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold px-4 py-2 rounded-full shadow-sm hover:border-blue-300 hover:text-blue-700 transition-colors">
              <UserPlus className="w-3.5 h-3.5" />{T('Sign in for personalized analysis', 'Login Karen - Personalized Report')}
            </button>
          )}
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="12" fill="none" />
                <circle cx="50" cy="50" r="40" stroke={gaugeColor} strokeWidth="12" fill="none" strokeDasharray={circumference} strokeDashoffset={strokeOffset} strokeLinecap="round" className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-800">{data.riskScore}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">{T('Risk', 'Khatra')}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 text-sm">{T('Risk Score', 'Jokhim Score')}</h3>
              <p className="text-slate-500 text-xs mt-0.5 leading-snug">{data.riskScore>=71?T('Very high - see a doctor immediately.','Bahut adhik khatra.'):data.riskScore>=31?T('Moderate - take with caution.','Madhyam khatra.'):T('No significant risks found.','Koi bada khatra nahi.')}</p>
              <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-1000" style={{width:`${data.riskScore}%`,background:gaugeColor}} /></div>
              <div className="mt-2"><ConfidenceBadge confidence={data.confidence} isHi={isHi} /></div>
            </div>
          </div>
        </div>

        <div className={`card ${vc.light} ${vc.border} border-2`}>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className={`font-bold text-sm ${vc.sub} flex items-center gap-2`}><Stethoscope className="w-4 h-4 flex-shrink-0" />{T('What to do next?','Aage Kya Karen?')}</h3>
            <TTSBtn text={isHi?(data.nextActionHindi||data.nextAction):data.nextAction} lang={lang} ttsKey="next" playing={playing} speak={speak} />
          </div>
          <p className={`font-bold text-sm ${vc.text} leading-snug`}>{isHi?(data.nextActionHindi||data.nextAction):data.nextAction}</p>
        </div>

        <DosageExceededAlert violations={data.dosageViolations} isHi={isHi} lang={lang} playing={playing} speak={speak} />

        {hasProfileWarnings && (
          <div className="card border-red-200 bg-red-50">
            <div className="flex items-start justify-between gap-2 mb-3">
              <h3 className="font-black text-red-900 text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-red-600 flex-shrink-0" />{T('Not Safe for Your Profile','Aapke Liye Surakshit Nahi')}</h3>
              <TTSBtn text={[...(data.diseaseWarnings||[]),...(data.allergyWarnings||[])].join('. ')} lang={lang} ttsKey="profile-warn" playing={playing} speak={speak} />
            </div>
            <ul className="space-y-2">
              {data.diseaseWarnings?.map((w,i) => <li key={`d${i}`} className="flex gap-2 text-xs font-semibold text-red-800 items-start bg-white rounded-lg p-2 border border-red-100"><X className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" /><span>{typeof w==='string'?w:w.reason}</span></li>)}
              {data.allergyWarnings?.map((w,i) => <li key={`a${i}`} className="flex gap-2 text-xs font-semibold text-red-800 items-start bg-white rounded-lg p-2 border border-red-100"><AlertOctagon className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" /><span>{typeof w==='string'?w:w.reason}</span></li>)}
              {(data.pregnancyWarning||data.pregnancyWarnings?.length>0)&&<li className="flex gap-2 text-xs font-semibold text-red-800 items-start bg-white rounded-lg p-2 border border-red-100"><Heart className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" /><span>{data.pregnancyWarnings?.[0]||T('Caution advised during pregnancy.','Garbhavastha mein savdhani barten.')}</span></li>}
            </ul>
          </div>
        )}

        {data.interactions?.length > 0 && (
          <div className="card">
            <div className="flex items-start justify-between gap-2 mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />{T('Drug Interactions','Dawao ka Aapas mein Asar')}</h3>
              <TTSBtn text={data.interactions.map(i=>`${i.drug1} with ${i.drug2}: ${i.reason}`).join('. ')} lang={lang} ttsKey="interactions" playing={playing} speak={speak} />
            </div>
            <div className="space-y-2">
              {data.interactions.map((int,i) => {
                const red = int.verdict==='dangerous'
                return (
                  <div key={i} className={`p-3 rounded-xl border ${red?'bg-red-50 border-red-200':'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {red?<AlertOctagon className="w-4 h-4 text-red-600 flex-shrink-0" />:<AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />}
                      <span className={`font-black text-xs ${red?'text-red-800':'text-amber-800'}`}>{int.drug1} + {int.drug2}</span>
                      <span className={`text-[9px] font-black ml-auto px-2 py-0.5 rounded-full uppercase ${red?'bg-red-200 text-red-800':'bg-amber-200 text-amber-800'}`}>{int.verdict}</span>
                    </div>
                    <p className={`text-xs leading-relaxed ${red?'text-red-700':'text-amber-700'}`}>{int.reason}</p>
                    {int.action&&<p className="text-xs text-slate-500 mt-1 font-semibold">{int.action}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {data.expiryWarning?.isExpired && (
          <div className="card border-red-300 bg-red-50">
            <div className="flex gap-3 items-start"><AlertOctagon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" /><div>
              <p className="font-bold text-red-900 text-sm">{T('Medicine Expired','Dawa Expire Ho Chuki Hai')}</p>
              <p className="text-xs text-red-700 mt-0.5">{isHi?`Yeh dawa ${data.expiryWarning.expiryDate} ko expire ho gai. Ise na len.`:`Expired on ${data.expiryWarning.expiryDate}. Do not consume.`}</p>
            </div></div>
          </div>
        )}

        {data.medicineDetails?.length > 0 && (
          <div>
            <SectionLabel>{T('Medicine Information','Dawao ki Puri Jankari')}</SectionLabel>
            <div className="space-y-3">{data.medicineDetails.map((med,i)=><MedicineCard key={i} med={med} idx={i} isHi={isHi} lang={lang} playing={playing} speak={speak} />)}</div>
          </div>
        )}

        {data.notFoundMedicines?.length > 0 && (
          <div className="card bg-amber-50 border-amber-200">
            <div className="flex gap-2 items-start"><Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" /><div>
              <p className="font-bold text-amber-900 text-sm mb-0.5">{T('Not found in database','Database mein nahi mila')}</p>
              <p className="text-xs text-amber-700">{data.notFoundMedicines.join(', ')} {T('- Try generic/salt name.','- Generic/salt naam se khojen.')}</p>
            </div></div>
          </div>
        )}

        {pricesList.length > 0 && (
          <div className="card">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-3"><IndianRupee className="w-4 h-4 text-emerald-600" />{T('Price','Keemat')}</h3>
            <div className="space-y-2">{pricesList.map((p,i)=><div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${p.isJanAushadhi?'bg-emerald-50 border-emerald-200':'bg-slate-50 border-slate-100'}`}><div className="min-w-0 flex-1"><p className={`font-bold text-sm truncate ${p.isJanAushadhi?'text-emerald-800':'text-slate-800'}`}>{p.isJanAushadhi&&'[JA] '}{p.brand}</p><p className="text-[10px] text-slate-400">{p.platform} - {p.unit}</p></div><div className="flex items-center gap-2 flex-shrink-0 ml-2"><span className={`font-black text-sm ${p.isJanAushadhi?'text-emerald-700':'text-slate-800'}`}>Rs.{p.priceINR}</span>{p.sourceUrl&&<a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600"><ExternalLink className="w-3.5 h-3.5" /></a>}</div></div>)}</div>
          </div>
        )}

        {(jaAlts.length>0||brandAlts.length>0) && (
          <div className="card">
            <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2"><TrendingDown className="w-4 h-4 text-emerald-500" />{T('Cheaper Alternatives','Saste Vikalp')}</h3>
            {jaAlts.map((a,i)=><div key={`ja-${i}`} className="flex items-center justify-between p-3 mb-2 bg-emerald-50 border border-emerald-200 rounded-xl"><div className="min-w-0 flex-1"><p className="font-black text-emerald-800 text-sm">[JA] {a.brandName}</p><p className="text-[10px] text-emerald-600 font-semibold">{a.genericName} - Jan Aushadhi</p></div>{a.priceINR&&<p className="font-black text-emerald-700 flex-shrink-0 ml-2">Rs.{a.priceINR}<span className="text-[9px]">/tab</span></p>}</div>)}
            {brandAlts.slice(0,3).map((a,i)=><div key={`ba-${i}`} className="flex items-center justify-between p-3 mb-1 bg-slate-50 border border-slate-100 rounded-xl"><div className="min-w-0 flex-1"><p className="font-bold text-slate-800 text-sm truncate">{a.brandName}</p><p className="text-[10px] text-slate-400">{a.genericName} - {a.manufacturer}</p></div><div className="text-right flex-shrink-0 ml-2">{a.priceINR&&<p className="font-black text-slate-700 text-sm">Rs.{a.priceINR}</p>}{a.savingsINR>0&&<span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">Save Rs.{a.savingsINR}</span>}</div></div>)}
          </div>
        )}

        {!data.isPersonalized && (
          <div className="card bg-gradient-to-br from-blue-600 to-indigo-700 border-0 text-white">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0"><ShieldCheck className="w-5 h-5 text-white" /></div>
              <div className="flex-1">
                <h3 className="font-bold text-base mb-1">{T('Get Personalized Safety Check','Personalized Jaanch Paen')}</h3>
                <p className="text-blue-100 text-xs mb-3 leading-relaxed">{T('Add your conditions & allergies for a smarter, tailored report.','Apni bimari, allergy joden - smart jaanch paen.')}</p>
                <button onClick={()=>setActivePage('auth')} className="bg-white text-blue-700 font-bold text-sm px-4 py-2 rounded-xl hover:bg-blue-50 transition-colors flex items-center gap-1.5"><UserPlus className="w-4 h-4" />{T('Create Free Profile','Mufat Profile Banaen')}</button>
              </div>
            </div>
          </div>
        )}

        <p className="text-[10px] text-slate-400 text-center leading-relaxed px-2 pb-2">{T('For educational purposes only. Not a substitute for professional medical advice.','Yeh jankari kewal shaikshik uddeshyon ke liye hai.')}{data.dataSource&&<span className="block mt-0.5 text-slate-300">Data: {data.dataSource}</span>}</p>
      </div>

      <div className="fixed bottom-[60px] md:bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40">
        <div className="max-w-2xl mx-auto flex gap-2">
          <button onClick={handleShare} className="btn-secondary h-12 px-4 flex-shrink-0 flex items-center gap-1.5 text-sm"><Share2 className="w-4 h-4" /></button>
          <button onClick={()=>setActivePage('search')} className="btn-primary flex-1 h-12 text-sm flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4" />{T('Check Another Medicine','Doosri Dawa Jaanchen')}</button>
        </div>
      </div>
    </div>
  )
}
