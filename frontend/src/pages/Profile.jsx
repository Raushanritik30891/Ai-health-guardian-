import React, { useState } from 'react'
import { useStore } from '../store/useStore'
import { User, Save, LogOut, ChevronRight, Shield, CheckCircle2, Edit2, Globe } from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '../services/firebase'
import toast from 'react-hot-toast'

const DISEASES = [
  { id: 'diabetes', en: 'Diabetes', hi: 'मधुमेह' },
  { id: 'hypertension', en: 'High BP', hi: 'हाई BP' },
  { id: 'kidney_disease', en: 'Kidney Disease', hi: 'किडनी रोग' },
  { id: 'liver_disease', en: 'Liver Disease', hi: 'लिवर रोग' },
  { id: 'asthma', en: 'Asthma', hi: 'दमा' },
  { id: 'heart_disease', en: 'Heart Disease', hi: 'हृदय रोग' },
  { id: 'ulcer', en: 'Ulcer', hi: 'अल्सर' },
  { id: 'thyroid', en: 'Thyroid', hi: 'थायरॉइड' },
  { id: 'epilepsy', en: 'Epilepsy', hi: 'मिर्गी' },
]

const ALLERGIES = [
  { id: 'penicillin', en: 'Penicillin', hi: 'पेनिसिलिन' },
  { id: 'nsaids', en: 'NSAIDs / Ibuprofen', hi: 'NSAIDs' },
  { id: 'aspirin', en: 'Aspirin', hi: 'एस्पिरिन' },
  { id: 'sulfa', en: 'Sulfa', hi: 'सल्फा' },
  { id: 'iodine', en: 'Iodine', hi: 'आयोडीन' },
]

export default function Profile() {
  const { profile, setProfile, user, setUser, setActivePage, setAuthLoading, ttsEnabled, setTtsEnabled } = useStore()
  const isHindi = profile?.language === 'hi'

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: profile?.name || '',
    age: profile?.age || '',
    gender: profile?.gender || '',
    isPregnant: profile?.isPregnant || false,
    diseases: profile?.diseases || [],
    allergies: profile?.allergies || [],
    currentMedicines: profile?.currentMedicines || '',
    blood_group: profile?.blood_group || '',
  })

  const toggleList = (field, item) => {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(item) ? f[field].filter(x => x !== item) : [...f[field], item]
    }))
  }

  const save = () => {
    setProfile({
      ...form,
      currentMedicines: typeof form.currentMedicines === 'string'
        ? form.currentMedicines.split(',').map(m => m.trim()).filter(Boolean)
        : form.currentMedicines
    })
    setEditing(false)
    toast.success(isHindi ? 'प्रोफाइल सेव हो गई' : 'Profile saved!')
  }

  const logout = async () => {
    try {
      await signOut(auth)
      setUser(null)
      setAuthLoading(false)
      toast.success(isHindi ? 'लॉगआउट हो गया' : 'Logged out successfully')
      setActivePage('home')
    } catch (e) {
      toast.error(e.message)
    }
  }

  const completeness = (() => {
    const p = profile || {}
    const fields = [p.name, p.age, p.gender, p.blood_group, p.diseases?.length, p.allergies?.length]
    return Math.round((fields.filter(Boolean).length / fields.length) * 100)
  })()

  const current_meds_display = Array.isArray(profile?.currentMedicines)
    ? profile.currentMedicines.join(', ')
    : profile?.currentMedicines || ''

  return (
    <div className="page">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <User className="w-6 h-6 text-blue-600" />
          {isHindi ? 'मेरी प्रोफाइल' : 'My Profile'}
        </h1>
        {!editing && (
          <button onClick={() => setEditing(true)} className="btn-secondary text-sm min-h-[36px] px-3">
            <Edit2 className="w-4 h-4" /> {isHindi ? 'संपादित करें' : 'Edit'}
          </button>
        )}
      </div>

      {/* Completeness bar */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700">{isHindi ? 'प्रोफाइल पूर्णता' : 'Profile Completeness'}</span>
          <span className={`font-black text-sm ${completeness >= 80 ? 'text-emerald-600' : completeness >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{completeness}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${completeness}%`, background: completeness >= 80 ? '#16a34a' : completeness >= 50 ? '#d97706' : '#dc2626' }}
          />
        </div>
        {completeness < 80 && (
          <p className="text-xs text-slate-400 mt-2">
            {isHindi ? 'अधिक सटीक दवा जांच के लिए प्रोफाइल पूरी करें।' : 'Complete your profile for more accurate medicine safety checks.'}
          </p>
        )}
      </div>

      {!editing ? (
        /* ── View Mode ── */
        <div className="space-y-3">
          {/* Basic info */}
          <div className="card">
            <h3 className="section-label mb-3">{isHindi ? 'व्यक्तिगत जानकारी' : 'Personal Info'}</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: isHindi ? 'नाम' : 'Name', value: profile?.name || '—' },
                { label: isHindi ? 'उम्र' : 'Age', value: profile?.age ? `${profile.age} yrs` : '—' },
                { label: isHindi ? 'लिंग' : 'Gender', value: profile?.gender || '—' },
                { label: isHindi ? 'ब्लड ग्रुप' : 'Blood Group', value: profile?.blood_group || '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">{label}</p>
                  <p className="font-semibold text-slate-800 text-sm capitalize">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Medical Info */}
          <div className="card">
            <h3 className="section-label mb-3">{isHindi ? 'स्वास्थ्य जानकारी' : 'Medical Info'}</h3>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">{isHindi ? 'बीमारियां' : 'Existing Conditions'}</p>
                {profile?.diseases?.length > 0
                  ? <div className="flex flex-wrap gap-1.5">{profile.diseases.map(d => <span key={d} className="badge badge-red text-[10px]">{DISEASES.find(x=>x.id===d)?.[isHindi?'hi':'en'] || d}</span>)}</div>
                  : <p className="text-sm text-slate-400 italic">{isHindi ? 'कोई नहीं' : 'None added'}</p>
                }
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">{isHindi ? 'एलर्जी' : 'Allergies'}</p>
                {profile?.allergies?.length > 0
                  ? <div className="flex flex-wrap gap-1.5">{profile.allergies.map(a => <span key={a} className="badge badge-amber text-[10px]">{ALLERGIES.find(x=>x.id===a)?.[isHindi?'hi':'en'] || a}</span>)}</div>
                  : <p className="text-sm text-slate-400 italic">{isHindi ? 'कोई नहीं' : 'None added'}</p>
                }
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">{isHindi ? 'मौजूदा दवाएं' : 'Current Medicines'}</p>
                <p className="text-sm text-slate-700 font-medium">{current_meds_display || (isHindi ? 'कोई नहीं' : 'None')}</p>
              </div>
            </div>
          </div>

          {/* Language */}
          <div className="card flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-semibold text-slate-800 text-sm">{isHindi ? 'भाषा' : 'Language'}</p>
                <p className="text-xs text-slate-400">{isHindi ? 'हिंदी' : 'English'}</p>
              </div>
            </div>
            <button
              onClick={() => setProfile({ language: isHindi ? 'en' : 'hi' })}
              className="btn-secondary text-xs min-h-[32px] px-3"
            >
              {isHindi ? 'English' : 'हिंदी'}
            </button>
          </div>

          {/* Voice & Audio */}
          <div className="card flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{isHindi ? 'आवाज़ और बोलकर पढ़ना' : 'Voice & Audio'}</p>
                <p className="text-xs text-slate-400">{isHindi ? 'बोलकर पढ़कर सुनाएं' : 'Read results aloud'}</p>
              </div>
            </div>
            <button
              onClick={() => setTtsEnabled(!ttsEnabled)}
              className={`w-12 h-6 rounded-full transition-all flex items-center ${ttsEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${ttsEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Auth section */}
          {user ? (
            <div className="card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-bold">{(user.email || 'U').charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{user.displayName || user.email}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>
              </div>
              <button onClick={logout} className="btn-secondary text-xs min-h-[32px] px-3 text-red-600 border-red-100 hover:bg-red-50">
                <LogOut className="w-3.5 h-3.5" /> {isHindi ? 'लॉगआउट' : 'Logout'}
              </button>
            </div>
          ) : (
            <div className="card bg-blue-50 border-blue-100 text-center">
              <p className="text-sm font-semibold text-blue-800 mb-3">
                {isHindi ? 'अपनी प्रोफाइल सेव करें' : 'Save your profile permanently'}
              </p>
              <button onClick={() => setActivePage('auth')} className="btn-primary text-sm min-h-[40px]">
                {isHindi ? 'लॉगिन / अकाउंट बनाएं' : 'Sign In or Sign Up'}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ── Edit Mode ── */
        <div className="space-y-4 animate-fade">
          <div className="card space-y-4">
            <h3 className="section-label">{isHindi ? 'व्यक्तिगत जानकारी' : 'Personal Info'}</h3>
            <div>
              <label className="lbl">{isHindi ? 'पूरा नाम' : 'Full Name'}</label>
              <input className="inp" placeholder="Name" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="lbl">{isHindi ? 'उम्र' : 'Age'}</label>
                <input className="inp" type="number" min="1" max="120" placeholder="Age" value={form.age} onChange={e => setForm(f=>({...f,age:parseInt(e.target.value)||''}))} />
              </div>
              <div>
                <label className="lbl">{isHindi ? 'ब्लड ग्रुप' : 'Blood Group'}</label>
                <select className="inp" value={form.blood_group} onChange={e => setForm(f=>({...f,blood_group:e.target.value}))}>
                  <option value="">Select</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g=><option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="lbl">{isHindi ? 'लिंग' : 'Gender'}</label>
              <div className="grid grid-cols-3 gap-2">
                {[{v:'male',en:'Male',hi:'पुरुष'},{v:'female',en:'Female',hi:'महिला'},{v:'other',en:'Other',hi:'अन्य'}].map(g=>(
                  <button key={g.v} onClick={()=>setForm(f=>({...f,gender:g.v}))} className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${form.gender===g.v?'bg-blue-600 text-white border-blue-600':'bg-white text-slate-600 border-slate-200'}`}>
                    {isHindi?g.hi:g.en}
                  </button>
                ))}
              </div>
            </div>
            {form.gender === 'female' && (
              <div className="flex items-center justify-between p-3 bg-pink-50 border border-pink-100 rounded-xl">
                <span className="text-sm font-semibold text-slate-700">{isHindi?'क्या आप प्रेगनेंट हैं?':'Are you pregnant?'}</span>
                <button onClick={()=>setForm(f=>({...f,isPregnant:!f.isPregnant}))} className={`w-12 h-6 rounded-full transition-all ${form.isPregnant?'bg-pink-500':'bg-slate-300'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isPregnant?'translate-x-6':'translate-x-0.5'} mt-0.5`} />
                </button>
              </div>
            )}
          </div>

          <div className="card space-y-4">
            <h3 className="section-label">{isHindi?'मौजूदा बीमारियां':'Existing Conditions'}</h3>
            <div className="flex flex-wrap gap-2">
              {DISEASES.map(d=>(
                <button key={d.id} onClick={()=>toggleList('diseases',d.id)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${form.diseases.includes(d.id)?'bg-red-500 text-white border-red-500':'bg-white text-slate-600 border-slate-200 hover:border-red-200'}`}>
                  {isHindi?d.hi:d.en}
                </button>
              ))}
            </div>
          </div>

          <div className="card space-y-4">
            <h3 className="section-label">{isHindi?'एलर्जी':'Allergies'}</h3>
            <div className="flex flex-wrap gap-2">
              {ALLERGIES.map(a=>(
                <button key={a.id} onClick={()=>toggleList('allergies',a.id)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${form.allergies.includes(a.id)?'bg-amber-500 text-white border-amber-500':'bg-white text-slate-600 border-slate-200 hover:border-amber-200'}`}>
                  {isHindi?a.hi:a.en}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <label className="lbl">{isHindi?'मौजूदा दवाएं (अल्पविराम से अलग करें)':'Current Medicines (comma separated)'}</label>
            <input className="inp" placeholder="Metformin, Amlodipine..." value={typeof form.currentMedicines==='string'?form.currentMedicines:form.currentMedicines?.join(', ')||''} onChange={e=>setForm(f=>({...f,currentMedicines:e.target.value}))} />
          </div>

          <div className="flex gap-3">
            <button onClick={()=>setEditing(false)} className="btn-secondary flex-1">{isHindi?'रद्द करें':'Cancel'}</button>
            <button onClick={save} className="btn-primary flex-[2]">
              <Save className="w-4 h-4" /> {isHindi?'प्रोफाइल सेव करें':'Save Profile'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
