'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button, Card, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import { AudioWaveform } from '@/components/ui/AudioWaveform'
import { useUser } from '@/context/UserContext'
import { useSettings } from '@/context/SettingsContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Web Speech API types
declare global {
  interface Window {
    SpeechRecognition: {
      new(): SpeechRecognition
      prototype: SpeechRecognition
    }
    webkitSpeechRecognition: {
      new(): SpeechRecognition
      prototype: SpeechRecognition
    }
  }
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition
  new(): SpeechRecognition
}

interface Correction {
  type: 'stutter' | 'repetition' | 'filler' | 'incomplete' | 'unclear'
  original: string
  corrected: string
}

interface Exchange {
  id: string
  timestamp: Date
  originalText: string
  correctedText: string
  confidence: number
  intent: string
  corrections: Correction[]
  isPlaying: boolean
}

export default function BridgePage() {
  const { user } = useUser()
  const { settings } = useSettings()
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentText, setCurrentText] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [exchanges, setExchanges] = useState<Exchange[]>([])
  const [audioLevel, setAudioLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [browserSupport, setBrowserSupport] = useState({
    microphone: true,
    speechRecognition: true,
    mediaRecorder: true,
    checked: false,
  })

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const finalTranscriptRef = useRef<string>('')
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null)

  // Check browser compatibility
  useEffect(() => {
    const support = {
      microphone: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      speechRecognition: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
      mediaRecorder: typeof MediaRecorder !== 'undefined',
      checked: true,
    }
    setBrowserSupport(support)

    if (!support.microphone || !support.mediaRecorder) {
      setError('Your browser does not support audio recording. Please use Chrome, Edge, or Safari.')
    }
  }, [])

  // Load exchange history for logged-in users
  useEffect(() => {
    const loadHistory = async () => {
      if (!user?._id) return

      try {
        const response = await fetch(`/api/bridge/exchange?userId=${user._id}&limit=10`)
        const data = await response.json()

        if (data.success && data.data.exchanges) {
          setExchanges(
            data.data.exchanges.map((e: {
              id: string
              createdAt: string
              originalText: string
              correctedText: string
              confidence: number
              intent: string
              corrections: Correction[]
            }) => ({
              id: e.id,
              timestamp: new Date(e.createdAt),
              originalText: e.originalText,
              correctedText: e.correctedText,
              confidence: e.confidence,
              intent: e.intent || '',
              corrections: e.corrections || [],
              isPlaying: false,
            }))
          )
        }
      } catch (err) {
        console.error('Failed to load history:', err)
      }
    }

    loadHistory()
  }, [user?._id])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [])

  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    if (playbackAudioRef.current) {
      playbackAudioRef.current.pause()
    }
  }

  // Create speech recognition instance
  const createSpeechRecognition = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionAPI) return null

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      let interim = ''
      let final = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += transcript
        } else {
          interim += transcript
        }
      }

      setInterimTranscript(interim)

      if (final) {
        finalTranscriptRef.current = (finalTranscriptRef.current + ' ' + final).trim()
      }
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access.')
      }
    }

    return recognition
  }, [])

  const startListening = async () => {
    try {
      setError(null)
      finalTranscriptRef.current = ''
      setInterimTranscript('')
      chunksRef.current = []

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Set up audio context for level monitoring
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)
      analyserRef.current.fftSize = 256

      const bufferLength = analyserRef.current.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      const updateLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b) / bufferLength
          setAudioLevel(average / 255)
          animationFrameRef.current = requestAnimationFrame(updateLevel)
        }
      }
      updateLevel()

      // Set up media recorder for audio capture
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      })

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.start(100)

      // Start speech recognition
      if (browserSupport.speechRecognition) {
        recognitionRef.current = createSpeechRecognition()
        recognitionRef.current?.start()
      }

      setIsListening(true)
    } catch (err) {
      console.error('Error accessing microphone:', err)
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setError('Microphone access denied. Please allow microphone access in your browser settings.')
        } else if (err.name === 'NotFoundError') {
          setError('No microphone found. Please connect a microphone.')
        } else {
          setError('Error accessing microphone. Please try again.')
        }
      }
    }
  }

  const stopListening = async () => {
    setIsListening(false)
    setIsProcessing(true)

    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    // Stop animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    setAudioLevel(0)

    // Get audio blob
    const getAudioBlob = (): Promise<Blob | null> => {
      return new Promise((resolve) => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
          resolve(chunksRef.current.length > 0 ? new Blob(chunksRef.current, { type: 'audio/webm' }) : null)
          return
        }

        mediaRecorderRef.current.onstop = () => {
          if (chunksRef.current.length > 0) {
            const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
            resolve(blob)
          } else {
            resolve(null)
          }
        }

        mediaRecorderRef.current.stop()
      })
    }

    const audioBlob = await getAudioBlob()

    // Stop audio stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }

    // Get the transcript (combine final + interim)
    const rawTranscript = (finalTranscriptRef.current + ' ' + interimTranscript).trim()

    if (!rawTranscript && !audioBlob) {
      setError('No speech detected. Please try again.')
      setIsProcessing(false)
      return
    }

    try {
      // Convert audio to base64 for AI processing
      let audioBase64: string | undefined
      if (audioBlob && audioBlob.size > 0) {
        audioBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1]
            resolve(base64)
          }
          reader.readAsDataURL(audioBlob)
        })
      }

      // Call Bridge API for speech correction
      const response = await fetch('/api/bridge/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawTranscript: rawTranscript || undefined,
          audioBase64: audioBase64,
          mimeType: 'audio/webm',
        }),
      })

      const data = await response.json()

      if (data.success) {
        const result = data.data

        // Create new exchange
        const newExchange: Exchange = {
          id: Date.now().toString(),
          timestamp: new Date(),
          originalText: result.originalText || rawTranscript,
          correctedText: result.correctedText,
          confidence: result.confidence,
          intent: result.intent,
          corrections: result.corrections || [],
          isPlaying: true,
        }

        setCurrentText(result.correctedText)
        setExchanges((prev) => [newExchange, ...prev])

        // Save to database if user is logged in
        if (user?._id) {
          fetch('/api/bridge/exchange', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user._id,
              originalText: result.originalText || rawTranscript,
              correctedText: result.correctedText,
              confidence: result.confidence,
              intent: result.intent,
              corrections: result.corrections,
            }),
          }).catch(console.error)
        }

        // Play the corrected text using TTS
        await playTTS(result.correctedText, newExchange.id)
      } else {
        setError('Failed to process speech. Please try again.')
      }
    } catch (err) {
      console.error('Processing error:', err)
      setError('Failed to process speech. Please try again.')
    }

    setIsProcessing(false)
    setInterimTranscript('')
  }

  const playTTS = async (text: string, exchangeId: string) => {
    try {
      // Try ElevenLabs first
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceId: settings.voiceId,
          speed: settings.speed,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data?.audio) {
          const audio = new Audio(`data:audio/mpeg;base64,${data.data.audio}`)
          audio.playbackRate = settings.speed
          playbackAudioRef.current = audio

          audio.onended = () => {
            setExchanges((prev) =>
              prev.map((e) => (e.id === exchangeId ? { ...e, isPlaying: false } : e))
            )
            setCurrentText('')
          }

          audio.onerror = () => {
            // Fallback to browser TTS
            playBrowserTTS(text, exchangeId)
          }

          await audio.play()
          return
        }
      }

      // Fallback to browser TTS
      playBrowserTTS(text, exchangeId)
    } catch (err) {
      console.error('TTS error:', err)
      playBrowserTTS(text, exchangeId)
    }
  }

  const playBrowserTTS = (text: string, exchangeId: string) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = settings.speed
    utterance.onend = () => {
      setExchanges((prev) =>
        prev.map((e) => (e.id === exchangeId ? { ...e, isPlaying: false } : e))
      )
      setCurrentText('')
    }
    speechSynthesis.speak(utterance)
  }

  const replayExchange = async (exchange: Exchange) => {
    // Stop any currently playing audio
    if (playbackAudioRef.current) {
      playbackAudioRef.current.pause()
    }
    speechSynthesis.cancel()

    setExchanges((prev) =>
      prev.map((e) => ({ ...e, isPlaying: e.id === exchange.id }))
    )

    await playTTS(exchange.correctedText, exchange.id)
  }

  const clearHistory = async () => {
    setExchanges([])

    if (user?._id) {
      try {
        await fetch(`/api/bridge/exchange?userId=${user._id}`, {
          method: 'DELETE',
        })
      } catch (err) {
        console.error('Failed to clear history:', err)
      }
    }
  }

  const getCorrectionTypeBadge = (type: string) => {
    switch (type) {
      case 'stutter':
        return <Badge size="sm" variant="error">Stutter</Badge>
      case 'repetition':
        return <Badge size="sm" variant="warning">Repetition</Badge>
      case 'filler':
        return <Badge size="sm" variant="outline">Filler</Badge>
      case 'incomplete':
        return <Badge size="sm" variant="primary">Incomplete</Badge>
      case 'unclear':
        return <Badge size="sm" variant="secondary">Unclear</Badge>
      default:
        return <Badge size="sm" variant="outline">{type}</Badge>
    }
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen p-6">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12h3l3-6 4 12 3-6h5"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-9-9"
                  opacity="0.5"
                />
              </svg>
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-neutral-900">
                Bridge Mode
              </h1>
              <p className="text-neutral-600">
                Speak naturally, communicate clearly
              </p>
            </div>
          </div>

          <div className="glass-card-solid p-4 bg-gradient-to-br from-primary-50/50 to-secondary-50/30">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-neutral-700">
                VoiceBridge translates your speech into clear, fluent audio in real-time. Perfect for conversations, ordering, or phone calls.
              </p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-error-50 border border-error-200 rounded-xl">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-error-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm text-error-800">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="text-xs text-error-600 underline mt-1"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Interface */}
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            {/* Current Text Display */}
            {(currentText || isProcessing || interimTranscript) && (
              <div className="w-full max-w-2xl mb-12 animate-fade-in">
                <div className="glass-card-solid p-8 bg-gradient-to-br from-secondary-50 to-primary-50 border-2 border-secondary-200">
                  {isProcessing ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-6">
                      <div className="animate-spin w-8 h-8 border-3 border-secondary-500 border-t-transparent rounded-full" />
                      <span className="text-secondary-700 font-medium">Translating your speech...</span>
                    </div>
                  ) : currentText ? (
                    <div className="text-center py-4">
                      <p className="text-3xl font-medium text-neutral-900 mb-6">
                        &quot;{currentText}&quot;
                      </p>
                      <div className="flex items-center justify-center gap-3">
                        <AudioWaveform isActive={true} />
                        <span className="text-sm text-secondary-600 font-medium">Speaking aloud...</span>
                      </div>
                    </div>
                  ) : interimTranscript ? (
                    <div className="text-center py-4">
                      <p className="text-xl text-neutral-600 italic">
                        &quot;{interimTranscript}&quot;
                      </p>
                      <p className="text-sm text-neutral-400 mt-2">Listening...</p>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* The Big Listen Button */}
            <div className="relative mb-6">
              {/* Pulse rings when listening */}
              {isListening && (
                <>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 animate-ping opacity-20" style={{ animationDuration: '1.5s' }} />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 animate-ping opacity-10" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
                </>
              )}

              <button
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing || !browserSupport.microphone || !browserSupport.mediaRecorder}
                aria-label={isListening ? 'Stop listening and process speech' : 'Start listening'}
                className={cn(
                  'relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full',
                  'flex flex-col items-center justify-center',
                  'transition-all duration-500 ease-out',
                  'focus:outline-none focus:ring-4 focus:ring-offset-4',
                  isListening
                    ? 'bg-gradient-to-br from-primary-500 via-secondary-500 to-primary-600 shadow-glow-purple focus:ring-primary-300 animate-gradient'
                    : 'bg-gradient-to-br from-primary-400 to-secondary-500 shadow-glow-purple focus:ring-primary-300',
                  (isProcessing || !browserSupport.microphone) && 'opacity-50 cursor-not-allowed',
                  !isListening && !isProcessing && browserSupport.microphone && 'hover:scale-105 hover:shadow-2xl'
                )}
              >
                {/* Audio level visualization */}
                {isListening && (
                  <div className="absolute inset-8 rounded-full border-4 border-white/30 flex items-center justify-center">
                    <div
                      className="rounded-full bg-white/20 transition-all duration-75"
                      style={{
                        width: `${50 + audioLevel * 50}%`,
                        height: `${50 + audioLevel * 50}%`,
                      }}
                    />
                  </div>
                )}

                <div className="relative z-10 flex flex-col items-center">
                  {isListening ? (
                    <>
                      <div className="mb-6 scale-150">
                        <AudioWaveform isActive={true} />
                      </div>
                      <span className="text-white text-2xl font-bold mb-2">Listening...</span>
                      <span className="text-white/80 text-base">Tap to stop</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-24 h-24 text-white mb-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 12h3l3-6 4 12 3-6h5"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-9-9"
                          opacity="0.5"
                        />
                      </svg>
                      <span className="text-white text-2xl font-bold mb-2">Tap to Speak</span>
                      <span className="text-white/80 text-base">Speak naturally at your pace</span>
                    </>
                  )}
                </div>
              </button>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/80 backdrop-blur-sm shadow-lg border border-neutral-200">
              <div
                className={cn(
                  'w-3 h-3 rounded-full',
                  isListening ? 'bg-secondary-500 animate-pulse' : isProcessing ? 'bg-warning-500 animate-pulse' : 'bg-neutral-300'
                )}
              />
              <span className="text-neutral-700 font-medium">
                {isListening ? 'Microphone active' : isProcessing ? 'Processing...' : 'Ready to listen'}
              </span>
            </div>
          </div>

          {/* Recent Exchanges */}
          {exchanges.length > 0 && (
            <div className="mt-16 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-neutral-800">Recent Exchanges</h2>
                <Badge variant="primary">{exchanges.length} {exchanges.length === 1 ? 'exchange' : 'exchanges'}</Badge>
              </div>
              <div className="space-y-4">
                {exchanges.slice(0, 10).map((exchange) => (
                  <div key={exchange.id} className="glass-card-solid p-5 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => replayExchange(exchange)}
                        aria-label={exchange.isPlaying ? 'Playing' : 'Replay this exchange'}
                        className={cn(
                          'w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-all',
                          exchange.isPlaying
                            ? 'bg-gradient-to-br from-secondary-400 to-secondary-500 shadow-lg'
                            : 'bg-gradient-to-br from-neutral-100 to-neutral-200 hover:from-secondary-50 hover:to-secondary-100'
                        )}
                      >
                        {exchange.isPlaying ? (
                          <AudioWaveform isActive={true} />
                        ) : (
                          <svg
                            className="w-6 h-6 text-neutral-600"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="error" size="sm">Original</Badge>
                          <p className="text-sm text-neutral-500 italic line-through truncate">
                            {exchange.originalText}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="success" size="sm">Corrected</Badge>
                          <p className="text-neutral-900 font-medium">
                            {exchange.correctedText}
                          </p>
                        </div>
                        {/* Show corrections made */}
                        {exchange.corrections && exchange.corrections.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-neutral-100">
                            <p className="text-xs text-neutral-500 mb-2">Corrections applied:</p>
                            <div className="flex flex-wrap gap-2">
                              {exchange.corrections.slice(0, 3).map((correction, i) => (
                                <span key={i}>
                                  {getCorrectionTypeBadge(correction.type)}
                                </span>
                              ))}
                              {exchange.corrections.length > 3 && (
                                <Badge size="sm" variant="outline">+{exchange.corrections.length - 3} more</Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs text-neutral-400 font-mono">
                          {exchange.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {exchange.confidence > 0 && (
                          <p className="text-xs text-neutral-500 mt-1">
                            {Math.round(exchange.confidence)}% confident
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-center">
                <Button
                  variant="outline"
                  onClick={clearHistory}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear History
                </Button>
              </div>
            </div>
          )}

          {/* Usage Tips */}
          {exchanges.length === 0 && !isListening && !isProcessing && (
            <div className="mt-16">
              <div className="glass-card-solid p-6 bg-gradient-to-br from-primary-50/30 to-secondary-50/30">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-800 mb-3 text-lg">How Bridge Mode Works</h3>
                    <ul className="text-sm text-neutral-700 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-primary-500 font-bold">1.</span>
                        <span>Tap the large button and speak naturally at your own pace</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary-500 font-bold">2.</span>
                        <span>VoiceBridge AI corrects stutters, pauses, and unclear speech</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary-500 font-bold">3.</span>
                        <span>Your message plays back in clear, fluent speech</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary-500 font-bold">4.</span>
                        <span>Replay any previous exchange by tapping the play button</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  )
}
