'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

interface UseSpeechSynthesisOptions {
  rate?: number
  pitch?: number
  volume?: number
  voiceURI?: string
}

interface UseSpeechSynthesisReturn {
  speak: (text: string) => void
  cancel: () => void
  pause: () => void
  resume: () => void
  isSpeaking: boolean
  isPaused: boolean
  isSupported: boolean
  voices: SpeechSynthesisVoice[]
}

export function useSpeechSynthesis(
  options: UseSpeechSynthesisOptions = {}
): UseSpeechSynthesisReturn {
  const { rate = 1, pitch = 1, volume = 1, voiceURI } = options

  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [isSupported, setIsSupported] = useState(false)

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true)

      const loadVoices = () => {
        const availableVoices = speechSynthesis.getVoices()
        setVoices(availableVoices)
      }

      loadVoices()
      speechSynthesis.onvoiceschanged = loadVoices

      return () => {
        speechSynthesis.onvoiceschanged = null
      }
    }
  }, [])

  const speak = useCallback(
    (text: string) => {
      if (!isSupported) return

      // Cancel any ongoing speech
      speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = rate
      utterance.pitch = pitch
      utterance.volume = volume

      // Find and set voice if specified
      if (voiceURI) {
        const voice = voices.find((v) => v.voiceURI === voiceURI)
        if (voice) {
          utterance.voice = voice
        }
      }

      utterance.onstart = () => {
        setIsSpeaking(true)
        setIsPaused(false)
      }

      utterance.onend = () => {
        setIsSpeaking(false)
        setIsPaused(false)
      }

      utterance.onpause = () => {
        setIsPaused(true)
      }

      utterance.onresume = () => {
        setIsPaused(false)
      }

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event)
        setIsSpeaking(false)
        setIsPaused(false)
      }

      utteranceRef.current = utterance
      speechSynthesis.speak(utterance)
    },
    [isSupported, rate, pitch, volume, voiceURI, voices]
  )

  const cancel = useCallback(() => {
    if (isSupported) {
      speechSynthesis.cancel()
      setIsSpeaking(false)
      setIsPaused(false)
    }
  }, [isSupported])

  const pause = useCallback(() => {
    if (isSupported && isSpeaking) {
      speechSynthesis.pause()
    }
  }, [isSupported, isSpeaking])

  const resume = useCallback(() => {
    if (isSupported && isPaused) {
      speechSynthesis.resume()
    }
  }, [isSupported, isPaused])

  return {
    speak,
    cancel,
    pause,
    resume,
    isSpeaking,
    isPaused,
    isSupported,
    voices,
  }
}
