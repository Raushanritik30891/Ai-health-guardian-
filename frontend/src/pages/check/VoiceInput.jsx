import React, { useState, useEffect, useRef } from 'react'
import { useStore } from '../../store/useStore'
import { Mic, MicOff, ChevronRight, X, AlertCircle, Volume2, RefreshCw } from 'lucide-react'

const SUPPORTED = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

export default function VoiceInput() {
  const { setActivePage, profile, setAnalysis } = useStore()
  const isHindi = profile?.language === 'hi'

  const [status, setStatus] = useState('idle') // idle | listening | processing | done | error
  const [transcript, setTranscript] = useState('')
  const [medicines, setMedicines] = useState([])
  const [errorMsg, setErrorMsg] = useState('')
  const [recognition, setRecognition] = useState(null)
  const transcriptRef = useRef('')

  useEffect(() => {
    if (!SUPPORTED) return
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SpeechRecognition()
    rec.lang = 'hi-IN'
    rec.interimResults = true
    rec.maxAlternatives = 3
    rec.continuous = false

    rec.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join(' ')
      transcriptRef.current = t
      setTranscript(t)
    }
    rec.onend = () => {
      setStatus(prev => prev === 'listening' ? 'processing' : prev)
      extractMedicines(transcriptRef.current)
    }
    rec.onerror = (e) => {
      setErrorMsg(isHindi
        ? 'आवाज़ नहीं सुन सके। कृपया फिर से माइक दबाएं।'
        : 'Could not understand. Please try again.')
      setStatus('error')
    }
    setRecognition(rec)
    return () => rec.abort()
  }, [])

  const extractMedicines = (text) => {
    if (!text?.trim()) { setStatus('error'); setErrorMsg(isHindi ? 'कुछ सुनाई नहीं दिया।' : 'Nothing was heard.'); return }

    // Basic extraction: split by common separators, filter out noise words
    const noiseWords = ['aur', 'and', 'ke', 'liye', 'mera', 'meri', 'dawa', 'दवा', 'और', 'का', 'की', 'है', 'मुझे', 'चाहिए', 'गोली']
    const words = text.split(/[,और\s]+/).map(w => w.trim()).filter(w => w.length > 2 && !noiseWords.includes(w.toLowerCase()))
    const extracted = words.filter(w => /[a-zA-Z\u0900-\u097F]/.test(w)).slice(0, 5)

    if (!extracted.length) {
      setMedicines([text.trim()])
    } else {
      setMedicines(extracted)
    }
    setStatus('done')
  }

  const startListening = () => {
    if (!recognition) return
    setTranscript('')
    transcriptRef.current = ''
    setMedicines([])
    setErrorMsg('')
    setStatus('listening')
    try { recognition.start() } catch {}
  }

  const stopListening = () => {
    recognition?.stop()
    setStatus('processing')
  }

  const retry = () => { setStatus('idle'); setTranscript(''); transcriptRef.current = ''; setMedicines([]); setErrorMsg('') }
  const removeMed = (m) => setMedicines(prev => prev.filter(x => x !== m))

  const proceed = () => {
    if (!medicines.length) return
    setAnalysis({ medicines, isAnalyzing: true, ocrData: null })
    setActivePage('analyzing')
  }

  const statusText = {
    idle: { en: 'Tap to speak', hi: 'माइक दबाएं' },
    listening: { en: 'Listening...', hi: 'सुन रहे हैं...' },
    processing: { en: 'Processing...', hi: 'समझ रहे हैं...' },
    done: { en: 'Got it!', hi: 'समझ गए!' },
    error: { en: 'Try again', hi: 'फिर कोशिश करें' },
  }

  const micColors = {
    idle: 'bg-amber-500 hover:bg-amber-600 shadow-amber-400/40',
    listening: 'bg-red-500 hover:bg-red-600 shadow-red-400/50 animate-pulse',
    processing: 'bg-blue-500 shadow-blue-400/40',
    done: 'bg-emerald-500 shadow-emerald-400/40',
    error: 'bg-slate-400 hover:bg-amber-500 shadow-slate-300/40',
  }

  return (
    <div className="page flex flex-col items-center text-center">
      <button onClick={() => setActivePage('dashboard')} className="self-start text-sm text-slate-400 hover:text-slate-600 font-semibold mb-8 flex items-center gap-1 group">
        <span className="group-hover:-translate-x-1 transition-transform">←</span>
        {isHindi ? 'वापस' : 'Back'}
      </button>

      <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
        <Mic className="w-7 h-7 text-amber-600" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">{isHindi ? 'हिंदी में बोलें' : 'Speak in Hindi'}</h1>
      <p className="text-slate-500 text-sm max-w-xs mx-auto mb-8 leading-relaxed">
        {isHindi
          ? 'माइक दबाएं और दवा का नाम बोलें। जैसे: "Dolo ₆₅₀ aur Pantop 40"'
          : 'Tap the mic and say the medicine name(s) out loud.'}
      </p>

      {!SUPPORTED && (
        <div className="alert alert-caution mb-6 text-sm w-full max-w-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{isHindi ? 'क्षमा करें, आपका ब्राउज़र आवाज को सपोर्ट नहीं करता। Chrome में खोलें।' : 'Your browser does not support voice input. Please use Chrome or Edge.'}</span>
        </div>
      )}

      {/* Big Mic Button */}
      <div className="relative mb-8">
        {status === 'listening' && (
          <>
            <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-20" />
            <div className="absolute inset-[-8px] rounded-full bg-red-400 animate-pulse opacity-10" />
          </>
        )}
        <button
          onClick={status === 'listening' ? stopListening : (status === 'done' ? retry : startListening)}
          disabled={status === 'processing' || !SUPPORTED}
          className={`relative w-28 h-28 rounded-full text-white flex items-center justify-center shadow-2xl transition-all ${micColors[status]} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {status === 'processing'
            ? <RefreshCw className="w-10 h-10 animate-spin" />
            : status === 'listening'
            ? <MicOff className="w-10 h-10" />
            : <Mic className="w-10 h-10" />
          }
        </button>
      </div>

      {/* Status label */}
      <p className={`font-bold text-lg mb-6 transition-colors ${
        status === 'listening' ? 'text-red-500' : status === 'done' ? 'text-emerald-600' : status === 'error' ? 'text-amber-600' : 'text-slate-600'
      }`}>
        {isHindi ? statusText[status].hi : statusText[status].en}
      </p>

      {/* Transcript */}
      {transcript && (
        <div className="w-full max-w-sm bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 text-left">
          <p className="section-label mb-2">{isHindi ? 'सुना गया' : 'Transcript'}</p>
          <p className="text-slate-700 font-medium text-sm italic">"{transcript}"</p>
        </div>
      )}

      {/* Error */}
      {status === 'error' && errorMsg && (
        <div className="alert alert-caution w-full max-w-sm mb-6 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Extracted Medicines */}
      {medicines.length > 0 && (
        <div className="w-full max-w-sm space-y-4 animate-slide-up">
          <div>
            <p className="section-label mb-3">{isHindi ? 'मिली दवाएं' : 'Extracted Medicines'}</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {medicines.map(m => (
                <div key={m} className="chip">
                  <span>{m}</span>
                  <button onClick={() => removeMed(m)} className="chip-remove">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={retry} className="btn-secondary flex-1 text-sm min-h-[44px]">
              <RefreshCw className="w-4 h-4" />
              {isHindi ? 'फिर से' : 'Retry'}
            </button>
            <button onClick={proceed} className="btn-primary flex-[2] text-sm min-h-[44px]">
              {isHindi ? 'जांचें' : 'Analyze'} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Or type manually */}
      <button
        onClick={() => setActivePage('search')}
        className="mt-8 text-slate-400 hover:text-slate-600 text-sm font-semibold underline underline-offset-4 transition-colors"
      >
        {isHindi ? 'या नाम टाइप करें →' : 'Or type medicine name instead →'}
      </button>
    </div>
  )
}
