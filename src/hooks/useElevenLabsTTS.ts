import { useState, useRef, useCallback } from 'react'

interface TTSOptions {
  voiceId?: string
  stability?: number
  similarityBoost?: number
}

export function useElevenLabsTTS() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const speak = useCallback(async (text: string, options: TTSOptions = {}) => {
    try {
      setIsLoading(true)
      setError(null)

      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voiceId: options.voiceId,
          stability: options.stability,
          similarityBoost: options.similarityBoost,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate speech')
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      const audio = new Audio(audioUrl)
      audioRef.current = audio

      audio.onplay = () => setIsPlaying(true)
      audio.onended = () => {
        setIsPlaying(false)
        URL.revokeObjectURL(audioUrl)
      }
      audio.onerror = () => {
        setIsPlaying(false)
        setError('Failed to play audio')
        URL.revokeObjectURL(audioUrl)
      }

      await audio.play()
    } catch (err) {
      console.error('TTS error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate speech')
      setIsPlaying(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
      setIsPlaying(false)
    }
  }, [])

  const speakWithFallback = useCallback(
    async (text: string, options: TTSOptions = {}) => {
      // Try ElevenLabs first, fall back to browser TTS if it fails
      try {
        await speak(text, options)
      } catch (err) {
        console.warn('ElevenLabs TTS failed, using fallback:', err)
        // Fallback to browser TTS
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 0.7
        utterance.onstart = () => setIsPlaying(true)
        utterance.onend = () => setIsPlaying(false)
        utterance.onerror = () => setIsPlaying(false)
        speechSynthesis.speak(utterance)
      }
    },
    [speak]
  )

  return {
    speak,
    speakWithFallback,
    stop,
    isPlaying,
    isLoading,
    error,
  }
}
