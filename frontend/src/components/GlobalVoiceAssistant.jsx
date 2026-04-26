import React, { useState, useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import { Mic, MicOff, X, Volume2, VolumeX } from 'lucide-react'
import toast from 'react-hot-toast'

const SUPPORTED = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

const levenshtein = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  return matrix[b.length][a.length];
}

const isFuzzyMatch = (spoken, keyword) => {
  if (spoken.includes(keyword)) return true;
  const spokenWords = spoken.split(/\s+/);
  const keywordWords = keyword.split(/\s+/);
  
  if (keywordWords.length > 1) {
    let allFound = true;
    for (const kw of keywordWords) {
      if (!spokenWords.some(sw => levenshtein(sw, kw) <= Math.max(1, Math.floor(kw.length / 4)))) {
        allFound = false;
        break;
      }
    }
    return allFound;
  } else {
    const threshold = Math.max(1, Math.floor(keyword.length / 4));
    return spokenWords.some(sw => levenshtein(sw, keyword) <= threshold);
  }
}

// Stop phrases to remove when a user asks a full question about a medicine
const STOP_PHRASES = [
  'ke baare mein batao', 'ke bare me batao', 'kya hai', 'kya kaam aati hai', 
  'kis kaam aati hai', 'kis liye hai', 'batao', 'tell me about', 'what is',
  'dawa', 'dawai', 'medicine', 'is for', 'ka fayda', 'ke nuksan', 
  'ke bare me', 'ke bare mein', 'kya kam karti hai', 'info', 'information',
  'jankari', 'do'
]

// NLP Intent Matching
// Maps fuzzy English/Hindi/Hinglish phrases to specific actions.
const INTENTS = [
  {
    action: 'NAV_HOME',
    keywords: ['home', 'wapas', 'shuru', 'start', 'mukhya', 'peeche', 'back', 'main', 'dashboard', 'pichla'],
  },
  {
    action: 'NAV_CHECK',
    keywords: ['check', 'search', 'khoj', 'naam se', 'likh ke', 'dhundo', 'find', 'manual', 'dhoondo'],
  },
  {
    action: 'NAV_SCAN',
    keywords: ['scan', 'photo', 'tasveer', 'camera', 'kheench', 'khicho', 'khincho', 'strip', 'patta', 'barcode', 'qr', 'pic', 'picture', 'image'],
  },
  {
    action: 'NAV_PROFILE',
    keywords: ['profile', 'mera khata', 'meri jankari', 'account', 'setting', 'settings', 'details', 'my profile'],
  },
  {
    action: 'NAV_SYMPTOMS',
    keywords: ['symptom', 'bimari', 'lakshan', 'tabiyat', 'kharab', 'fever', 'bukhar', 'dard', 'pain', 'ill', 'sick', 'beemar'],
  },
  {
    action: 'NAV_INTERACTIONS',
    keywords: ['interaction', 'reaction', 'milakar', 'saath mein', 'sath me', 'side effect', 'nuksan', 'khatra', 'mix'],
  },
  {
    action: 'ACTION_READ',
    keywords: ['padh ke sunao', 'padho', 'bol ke sunao', 'read', 'speak', 'batao kya likha hai', 'sunna hai', 'aawaz', 'voice', 'audio', 'sunao', 'pronounce'],
  },
  {
    action: 'ACTION_STOP_READING',
    keywords: ['chup', 'band karo', 'ruk jao', 'stop', 'shant', 'bas', 'cancel', 'mute', 'quiet'],
  }
]

export default function GlobalVoiceAssistant() {
  const { setActivePage, profile, ttsEnabled, setTtsEnabled, setAnalysis } = useStore()
  const isHindi = profile?.language === 'hi'

  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [showTooltip, setShowTooltip] = useState(false)
  const recognitionRef = useRef(null)

  useEffect(() => {
    if (!SUPPORTED) return
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SpeechRecognition()
    
    // Auto-detect or use Hindi to better capture rural/Hinglish accents
    rec.lang = profile?.language === 'hi' ? 'hi-IN' : 'en-IN'
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.continuous = false

    rec.onstart = () => {
      setIsListening(true)
      setTranscript('')
      setShowTooltip(true)
    }

    rec.onresult = (e) => {
      const text = e.results[0][0].transcript.toLowerCase()
      setTranscript(text)
      handleIntent(text)
    }

    rec.onerror = (e) => {
      setIsListening(false)
      toast.error(isHindi ? 'समझ नहीं आया, फिर से बोलें' : 'Could not understand, try again')
      setTimeout(() => setShowTooltip(false), 2000)
    }

    rec.onend = () => {
      setIsListening(false)
      setTimeout(() => setShowTooltip(false), 3000)
    }

    recognitionRef.current = rec
    return () => rec.abort()
  }, [profile?.language, isHindi])

  const handleIntent = (text) => {
    // Basic NLP matching
    let matchedAction = null
    let maxMatch = 0

    for (const intent of INTENTS) {
      let matches = 0
      for (const keyword of intent.keywords) {
        if (isFuzzyMatch(text, keyword)) {
          matches++
        }
      }
      if (matches > maxMatch) {
        maxMatch = matches
        matchedAction = intent.action
      }
    }

    if (!matchedAction) {
      // Clean up common "question" words from the text to extract just the medicine name
      let cleanText = text;
      STOP_PHRASES.forEach(phrase => {
        cleanText = cleanText.replace(new RegExp(`\\b${phrase}\\b`, 'gi'), '');
      });
      // Also do a generic replace for exact substring without word boundaries for robustness in Hindi
      STOP_PHRASES.forEach(phrase => {
        cleanText = cleanText.replace(new RegExp(phrase, 'gi'), '');
      });
      cleanText = cleanText.trim().replace(/\s{2,}/g, ' '); // remove extra spaces

      if (cleanText.length > 2) {
        toast(isHindi ? `दवा जांची जा रही है: "${cleanText}"` : `Checking medicine: "${cleanText}"`, { icon: '🔍' })
        const defaultSchedule = [{ medicine: cleanText, time: '08:00', dose_mg: 500 }]
        setAnalysis({
          medicines: [cleanText],
          medicationSchedule: defaultSchedule,
          ocrData: null,
          isAnalyzing: true
        })
        setActivePage('analyzing')
      } else {
        toast(isHindi ? `सुना: "${text}" पर समझ नहीं आया` : `Heard: "${text}" but didn't understand`, { icon: '🤔' })
      }
      return
    }

    // Execute Action
    switch (matchedAction) {
      case 'NAV_HOME':
        setActivePage('home')
        speakResponse(isHindi ? 'होम पेज पर जा रहे हैं' : 'Going home')
        break
      case 'NAV_CHECK':
        setActivePage('search')
        speakResponse(isHindi ? 'दवा सर्च खोल रहे हैं' : 'Opening medicine search')
        break
      case 'NAV_SCAN':
        setActivePage('scan')
        speakResponse(isHindi ? 'स्कैनर खोल रहे हैं, कैमरे की अनुमति दें' : 'Opening scanner, please allow camera')
        break
      case 'NAV_PROFILE':
        setActivePage('profile')
        speakResponse(isHindi ? 'आपकी प्रोफाइल खोल रहे हैं' : 'Opening profile')
        break
      case 'NAV_SYMPTOMS':
        setActivePage('symptoms')
        speakResponse(isHindi ? 'लक्षण जांच खोल रहे हैं' : 'Opening symptom checker')
        break
      case 'NAV_INTERACTIONS':
        setActivePage('interactions')
        speakResponse(isHindi ? 'रिएक्शन जांच खोल रहे हैं' : 'Opening interactions check')
        break
      case 'ACTION_READ':
        // Trigger a global read event or just toggle TTS
        if (!ttsEnabled) {
          setTtsEnabled(true)
          toast.success(isHindi ? 'पढ़ना शुरू किया' : 'Voice readout enabled')
        }
        // Force reading of current page by emitting a custom event (handled in pages)
        window.dispatchEvent(new CustomEvent('ahg-read-page'))
        break
      case 'ACTION_STOP_READING':
        window.speechSynthesis.cancel()
        toast.success(isHindi ? 'पढ़ना बंद किया' : 'Stopped reading')
        break
      default:
        break
    }
  }

  const speakResponse = (text) => {
    if (!ttsEnabled || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = isHindi ? 'hi-IN' : 'en-IN'
    window.speechSynthesis.speak(utterance)
  }

  const toggleListen = () => {
    if (!SUPPORTED) {
      toast.error(isHindi ? 'आपका फोन आवाज सपोर्ट नहीं करता' : 'Voice not supported on this device')
      return
    }
    if (isListening) {
      recognitionRef.current?.stop()
    } else {
      try {
        recognitionRef.current?.start()
      } catch (e) {
        console.error(e)
      }
    }
  }

  if (!SUPPORTED) return null

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">
      {/* Tooltip / Transcript */}
      {showTooltip && (
        <div className="bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-2xl shadow-xl shadow-slate-900/20 max-w-[200px] animate-fade-in text-right">
          {isListening ? (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              {isHindi ? 'सुन रहे हैं...' : 'Listening...'}
            </span>
          ) : transcript ? (
            <span className="italic">"{transcript}"</span>
          ) : null}
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={toggleListen}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all ${
          isListening 
            ? 'bg-red-500 shadow-red-500/40 animate-pulse' 
            : 'bg-gradient-to-br from-blue-600 to-blue-800 shadow-blue-600/30 hover:scale-105'
        }`}
      >
        {isListening ? (
          <MicOff className="w-6 h-6 text-white" />
        ) : (
          <Mic className="w-6 h-6 text-white" />
        )}
      </button>
    </div>
  )
}
