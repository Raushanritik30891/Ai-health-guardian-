/**
 * useVoice — Web Speech API hook for voice input + TTS output
 * Supports Hindi (hi-IN) and English (en-IN)
 */
import { useState, useRef, useCallback } from 'react'
import { useStore } from '../store/useStore'

export function useVoice() {
  const { profile, ttsEnabled } = useStore()
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState(null)
  const recognitionRef = useRef(null)

  const isSupported = typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition)

  const isTTSSupported = typeof window !== 'undefined' &&
    !!window.speechSynthesis

  // ── Voice Input ────────────────────────────────
  const startListening = useCallback((onResult, onEnd) => {
    if (!isSupported) {
      setError('Voice input not supported. Please use Chrome or Edge.')
      return
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()

    rec.lang = profile.language === 'hi' ? 'hi-IN' : 'en-IN'
    rec.continuous = false
    rec.interimResults = false
    rec.maxAlternatives = 1

    rec.onstart = () => {
      setIsListening(true)
      setError(null)
    }

    rec.onresult = (e) => {
      const text = e.results[0][0].transcript
      if (onResult) onResult(text)
    }

    rec.onerror = (e) => {
      setError(`Voice error: ${e.error}`)
      setIsListening(false)
    }

    rec.onend = () => {
      setIsListening(false)
      if (onEnd) onEnd()
    }

    rec.start()
    recognitionRef.current = rec
  }, [isSupported, profile.language])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
  }, [])

  // ── Text-to-Speech ─────────────────────────────
  const speak = useCallback((text, options = {}) => {
    if (!isTTSSupported || !ttsEnabled) return

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    // Clean text (remove emojis and markdown for speech)
    const cleanText = text
      .replace(/[🟢🟡🔴⚠️✅🌿🏥💊💡→•◆🎯🚨❤️🔴]/g, '')
      .replace(/\*\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .substring(0, 500) // Limit length for TTS

    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = profile.language === 'hi' ? 'hi-IN' : 'en-IN'
    utterance.rate = options.rate || 0.9
    utterance.pitch = options.pitch || 1
    utterance.volume = options.volume || 1

    window.speechSynthesis.speak(utterance)
  }, [isTTSSupported, ttsEnabled, profile.language])

  const stopSpeaking = useCallback(() => {
    if (isTTSSupported) window.speechSynthesis.cancel()
  }, [isTTSSupported])

  return {
    isListening,
    isSupported,
    isTTSSupported,
    error,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  }
}
