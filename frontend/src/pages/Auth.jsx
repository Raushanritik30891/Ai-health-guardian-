import React, { useState } from 'react'
import { useStore } from '../store/useStore'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '../services/firebase'
import { Mail, Lock, User, ShieldCheck, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Auth() {
  const { setActivePage, profile } = useStore()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const isHindi = profile?.language === 'hi'

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, form.email, form.password)
        toast.success(isHindi ? 'सफलतापूर्वक लॉगिन किया' : 'Logged in successfully!')
        setActivePage('dashboard')
      } else {
        if (form.password !== form.confirmPassword) {
          toast.error(isHindi ? 'पासवर्ड मेल नहीं खाते' : 'Passwords do not match')
          setLoading(false)
          return
        }
        if (form.password.length < 6) {
          toast.error(isHindi ? 'पासवर्ड कम से कम 6 अक्षर का होना चाहिए' : 'Password must be at least 6 characters')
          setLoading(false)
          return
        }
        await createUserWithEmailAndPassword(auth, form.email, form.password)
        toast.success(isHindi ? 'अकाउंट बन गया!' : 'Account created successfully!')
        setActivePage('onboarding')
      }
    } catch (error) {
      const msg = error.code === 'auth/user-not-found' ? (isHindi ? 'यूजर नहीं मिला।' : 'User not found.')
        : error.code === 'auth/wrong-password' ? (isHindi ? 'गलत पासवर्ड।' : 'Incorrect password.')
        : error.code === 'auth/email-already-in-use' ? (isHindi ? 'यह ईमेल पहले से रजिस्टर है।' : 'Email already in use.')
        : error.message
      toast.error(msg)
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
      toast.success(isHindi ? 'Google से लॉगिन किया' : 'Signed in with Google!')
      setActivePage('dashboard')
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-slate-50">
      {/* BG decoration */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none" />

      {/* Back button */}
      <button
        onClick={() => setActivePage('home')}
        className="absolute top-4 left-4 flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm font-semibold transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> {isHindi ? 'होम' : 'Home'}
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-600/30">
          <ShieldCheck className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <div className="font-black text-slate-900 leading-tight">AI Health Guardian</div>
          <div className="text-[10px] font-semibold text-slate-400">Medicine Safety Copilot</div>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-slate-200/60 border border-slate-100 p-7">
        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
          {[
            { key: true,  en: 'Login',    hi: 'लॉगिन' },
            { key: false, en: 'Sign Up',  hi: 'साइन अप' },
          ].map(tab => (
            <button
              key={String(tab.key)}
              onClick={() => setIsLogin(tab.key)}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${isLogin === tab.key ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {isHindi ? tab.hi : tab.en}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="lbl">{isHindi ? 'पूरा नाम' : 'Full Name'}</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  required type="text" value={form.name} onChange={set('name')}
                  className="inp pl-11"
                  placeholder={isHindi ? 'राम कुमार' : 'Your name'}
                />
              </div>
            </div>
          )}

          <div>
            <label className="lbl">{isHindi ? 'ईमेल' : 'Email Address'}</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                required type="email" value={form.email} onChange={set('email')}
                className="inp pl-11"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="lbl">{isHindi ? 'पासवर्ड' : 'Password'}</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                required type={showPw ? 'text' : 'password'}
                value={form.password} onChange={set('password')}
                className="inp pl-11 pr-11"
                placeholder="••••••••"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="lbl">{isHindi ? 'पासवर्ड पुष्टि' : 'Confirm Password'}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  required type={showPw ? 'text' : 'password'}
                  value={form.confirmPassword} onChange={set('confirmPassword')}
                  className="inp pl-11"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          <button
            disabled={loading}
            type="submit"
            className="btn-primary w-full btn-lg mt-2"
          >
            {loading
              ? (isHindi ? 'प्रतीक्षा करें...' : 'Please wait...')
              : isLogin
              ? (isHindi ? 'लॉगिन करें' : 'Login')
              : (isHindi ? 'अकाउंट बनाएं' : 'Create Account')
            }
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs font-bold text-slate-400">OR</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 py-3.5 border-2 border-slate-200 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all text-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {isHindi ? 'Google से जारी रखें' : 'Continue with Google'}
        </button>
      </div>

      {/* Skip CTA */}
      <button
        onClick={() => setActivePage('search')}
        className="mt-6 text-slate-400 hover:text-slate-600 text-sm font-semibold flex items-center gap-1.5 transition-colors group"
      >
        {isHindi ? 'बिना अकाउंट के जांचें' : 'Continue without account'}
        <span className="group-hover:translate-x-1 transition-transform">→</span>
      </button>

      <p className="text-center text-[10px] text-slate-400 mt-4 max-w-xs">
        {isHindi
          ? 'आगे बढ़ने पर आप हमारी उपयोग की शर्तें और गोपनीयता नीति से सहमत होते हैं।'
          : 'By continuing, you agree to our Terms of Service and Privacy Policy.'}
      </p>
    </div>
  )
}
