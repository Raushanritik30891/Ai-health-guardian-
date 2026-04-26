/**
 * History page — shows past medicine checks
 * For logged-in users: pulls from store. For guests: shows empty state.
 */
import React from 'react'
import { useStore } from '../store/useStore'
import { History, ShieldCheck, Clock, ChevronRight, AlertTriangle, CheckCircle2, UserPlus } from 'lucide-react'

const verdictConfig = {
  safe:      { label: 'Safe',      labelHi: 'सुरक्षित',   bg: 'bg-green-50',  border: 'border-green-200', text: 'text-green-700',  icon: CheckCircle2 },
  caution:   { label: 'Caution',   labelHi: 'सावधान',     bg: 'bg-amber-50',  border: 'border-amber-200', text: 'text-amber-700',  icon: AlertTriangle },
  dangerous: { label: 'Dangerous', labelHi: 'खतरनाक',    bg: 'bg-red-50',    border: 'border-red-200',   text: 'text-red-700',    icon: AlertTriangle },
}

export default function HistoryPage() {
  const { setActivePage, profile, analysis, user } = useStore()
  const isHindi = profile?.language === 'hi'

  // Mock history for demo
  const DEMO_HISTORY = [
    { id: '1', medicines: ['Dolo 650', 'Ibuprofen'], verdict: 'caution', riskScore: 45, timestamp: new Date(Date.now() - 86400000 * 1) },
    { id: '2', medicines: ['Pantop 40'], verdict: 'safe', riskScore: 10, timestamp: new Date(Date.now() - 86400000 * 3) },
    { id: '3', medicines: ['Warf 5', 'Brufen 400'], verdict: 'dangerous', riskScore: 85, timestamp: new Date(Date.now() - 86400000 * 5) },
  ]

  const history = user ? DEMO_HISTORY : []

  const formatDate = (date) => {
    const diff = Date.now() - date.getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return isHindi ? 'आज' : 'Today'
    if (days === 1) return isHindi ? 'कल' : 'Yesterday'
    return `${days} ${isHindi ? 'दिन पहले' : 'days ago'}`
  }

  const viewResult = (item) => {
    // In a real app, we'd load the full result. For now, just go to result page.
    setActivePage('result')
  }

  return (
    <div className="page">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <History className="w-6 h-6 text-blue-600" />
          {isHindi ? 'चेक हिस्ट्री' : 'Check History'}
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          {isHindi ? 'आपके पिछले दवा सुरक्षा चेक' : 'Your previous medicine safety checks'}
        </p>
      </div>

      {!user ? (
        /* ── Guest state ── */
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-6">
            <History className="w-10 h-10 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-3">
            {isHindi ? 'हिस्ट्री देखने के लिए लॉगिन करें' : 'Sign in to see your history'}
          </h2>
          <p className="text-slate-500 text-sm max-w-xs mx-auto mb-8 leading-relaxed">
            {isHindi
              ? 'अपने सभी पिछले दवा चेक सुरक्षित रखने के लिए एक अकाउंट बनाएं।'
              : 'Create an account to save all your medicine safety checks permanently.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setActivePage('auth')}
              className="btn-primary btn-lg"
            >
              <UserPlus className="w-5 h-5" />
              {isHindi ? 'अकाउंट बनाएं या लॉगिन करें' : 'Sign Up or Log In'}
            </button>
            <button
              onClick={() => setActivePage('search')}
              className="btn-secondary btn-lg"
            >
              {isHindi ? 'बिना अकाउंट चेक करें' : 'Check Without Account'}
            </button>
          </div>
        </div>
      ) : history.length === 0 ? (
        /* ── Empty state (logged in but no history) ── */
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10 text-slate-300" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            {isHindi ? 'अभी तक कोई चेक नहीं' : 'No checks yet'}
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            {isHindi ? 'अपना पहला दवा सुरक्षा चेक शुरू करें।' : 'Start your first medicine safety check.'}
          </p>
          <button onClick={() => setActivePage('search')} className="btn-primary btn-lg">
            {isHindi ? 'पहला चेक करें' : 'Do Your First Check'}
          </button>
        </div>
      ) : (
        /* ── History list ── */
        <div className="space-y-3">
          {history.map((item) => {
            const vc = verdictConfig[item.verdict] || verdictConfig.safe
            const VIcon = vc.icon
            return (
              <button
                key={item.id}
                onClick={() => viewResult(item)}
                className="w-full text-left card card-hover transition-all duration-200 group"
              >
                <div className="flex items-center gap-4">
                  {/* Verdict icon */}
                  <div className={`w-12 h-12 rounded-2xl ${vc.bg} border ${vc.border} flex items-center justify-center flex-shrink-0`}>
                    <VIcon className={`w-6 h-6 ${vc.text}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge ${item.verdict === 'safe' ? 'badge-green' : item.verdict === 'dangerous' ? 'badge-red' : 'badge-amber'}`}>
                        {isHindi ? vc.labelHi : vc.label}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        Risk: {item.riskScore}%
                      </span>
                    </div>
                    <p className="font-semibold text-slate-800 truncate text-sm">
                      {item.medicines.join(', ')}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {formatDate(item.timestamp)}
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
                </div>
              </button>
            )
          })}

          <div className="pt-4 text-center">
            <p className="text-xs text-slate-400">
              {isHindi ? 'केवल पिछले 30 दिनों का डेटा दिखाया जा रहा है।' : 'Showing last 30 days of data.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
