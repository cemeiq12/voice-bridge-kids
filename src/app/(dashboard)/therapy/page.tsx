'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button, Card, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import { AudioWaveform } from '@/components/ui/AudioWaveform'
import { EmotionBadge } from '@/components/ui/EmotionBadge'
import { StatCard } from '@/components/ui/StatCard'
import { useUser } from '@/context/UserContext'
import { useSettings } from '@/context/SettingsContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { VOICE_PRESETS } from '@/lib/elevenlabs'

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

interface PracticePrompt {
  id: string
  text: string
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  targetPhonemes: string[]
}

interface WordAnalysis {
  word: string
  status: 'correct' | 'incorrect' | 'missing' | 'extra'
  position: number
  suggestion?: string
}

interface PhonemeIssue {
  phoneme: string
  word: string
  description: string
  tip: string
}

interface AnalysisResult {
  transcribedText: string
  targetText: string
  accuracy: number
  clarityScore: number
  wordAnalysis: WordAnalysis[]
  phonemeIssues: PhonemeIssue[]
  overallScore: number
  recommendations: string[]
  emotion: 'happy' | 'calm' | 'frustrated' | 'anxious' | 'confident' | 'neutral'
  fluencyScore?: number
  prosody?: {
    score: number
    pacing: 'slow' | 'balanced' | 'fast'
    intonation: string
  }
}

interface TranscriptLine {
  timestamp: string
  text: string
  type: 'system' | 'user' | 'analysis' | 'feedback'
  keywords?: string[]
}

const defaultPrompts: PracticePrompt[] = [
  { id: '1', text: 'The quick brown fox jumps over the lazy dog.', difficulty: 'easy', category: 'General', targetPhonemes: ['th', 'qu', 'j'] },
  { id: '2', text: 'She sells seashells by the seashore.', difficulty: 'medium', category: 'S Sounds', targetPhonemes: ['sh', 's'] },
  { id: '3', text: 'Peter Piper picked a peck of pickled peppers.', difficulty: 'hard', category: 'P Sounds', targetPhonemes: ['p'] },
  { id: '4', text: 'I would like a coffee, please.', difficulty: 'easy', category: 'Daily Life', targetPhonemes: ['l', 'f'] },
  { id: '5', text: 'Thank you for your help with this.', difficulty: 'medium', category: 'Politeness', targetPhonemes: ['th', 'h'] },
]

export default function TherapyPage() {
  const { user } = useUser()
  const { settings } = useSettings()

  // New state for Custom Prompts and Voice Selection
  const [mode, setMode] = useState<'preset' | 'custom'>('preset')
  const [customText, setCustomText] = useState('')
  const [selectedVoice, setSelectedVoice] = useState(VOICE_PRESETS.THERAPY)

  const [prompts, setPrompts] = useState<PracticePrompt[]>(defaultPrompts)
  const [selectedPrompt, setSelectedPrompt] = useState<PracticePrompt>(defaultPrompts[0])
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPlayingReference, setIsPlayingReference] = useState(false)
  const [sessionTime, setSessionTime] = useState(0)
  const [currentEmotion, setCurrentEmotion] = useState<'happy' | 'calm' | 'frustrated' | 'anxious' | 'confident' | 'neutral'>('calm')
  const [transcript, setTranscript] = useState<TranscriptLine[]>([
    { timestamp: '00:00', text: 'Session ready. Select a prompt and start recording.', type: 'system' },
  ])
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [sessionStats, setSessionStats] = useState({
    clarityScore: 0,
    accuracy: 0,
    wordsPracticed: 0,
    sessionsToday: 0,
    totalSpeakingTime: 0,
    totalClarityScore: 0,
    totalAccuracy: 0,
    attemptCount: 0,
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [browserSupport, setBrowserSupport] = useState<{
    microphone: boolean
    speechRecognition: boolean
    mediaRecorder: boolean
    checked: boolean
  }>({ microphone: true, speechRecognition: true, mediaRecorder: true, checked: false })
  const [microphoneError, setMicrophoneError] = useState<string | null>(null)
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null)
  const [isPlayingRecording, setIsPlayingRecording] = useState(false)
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null)

  // Refs for audio handling
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const sessionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Web Speech API for real-time transcription
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const [interimTranscript, setInterimTranscript] = useState('')
  const finalTranscriptRef = useRef<string>('')

  // Check browser compatibility on mount
  useEffect(() => {
    const checkBrowserSupport = async () => {
      const support = {
        microphone: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        speechRecognition: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
        mediaRecorder: typeof MediaRecorder !== 'undefined',
        checked: true,
      }
      setBrowserSupport(support)

      if (!support.microphone || !support.mediaRecorder) {
        setTranscript([{
          timestamp: '00:00',
          text: 'Your browser does not support audio recording. Please use Chrome, Edge, or Safari.',
          type: 'system'
        }])
      } else if (!support.speechRecognition) {
        setTranscript([{
          timestamp: '00:00',
          text: 'Speech recognition is not supported in your browser. Recording will work but live transcription is disabled. For best experience, use Chrome or Edge.',
          type: 'system'
        }])
      }
    }

    checkBrowserSupport()
  }, [])

  // Keyboard shortcuts - using refs to avoid stale closures
  const isRecordingRef = useRef(isRecording)
  const isProcessingRef = useRef(isProcessing)
  isRecordingRef.current = isRecording
  isProcessingRef.current = isProcessing

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return
      }

      // Space bar to toggle recording
      if (e.code === 'Space' && !isProcessingRef.current) {
        e.preventDefault()
        if (isRecordingRef.current) {
          stopRecording()
        } else if (browserSupport.microphone && browserSupport.mediaRecorder) {
          startRecording()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [browserSupport])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [])

  // Load prompts based on difficulty
  useEffect(() => {
    loadPrompts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty])

  // Load session stats from localStorage or database
  useEffect(() => {
    const loadStats = async () => {
      setIsLoadingStats(true)

      // Try to load from localStorage (with fallback for private browsing)
      try {
        // Check if it's a new day and reset daily stats
        const today = new Date().toDateString()
        const storedDate = localStorage.getItem('therapyStatsDate')

        if (storedDate !== today) {
          // New day - reset daily counters
          localStorage.setItem('therapyStatsDate', today)
          localStorage.removeItem('therapySessionStats')
        }

        // Load from localStorage first
        const storedStats = localStorage.getItem('therapySessionStats')
        if (storedStats) {
          const parsed = JSON.parse(storedStats)
          setSessionStats(parsed)
        }
      } catch (e) {
        // localStorage not available (private browsing, etc.)
        console.warn('localStorage not available:', e)
      }

      // If user is logged in, also fetch from database
      if (user?._id) {
        try {
          const response = await fetch(`/api/therapy/stats?userId=${user._id}`)
          const data = await response.json()
          if (data.success && data.data) {
            setSessionStats(prev => ({
              ...prev,
              // Merge database stats with local stats
              sessionsToday: data.data.sessionsToday || prev.sessionsToday,
              wordsPracticed: data.data.wordsPracticed || prev.wordsPracticed,
              totalSpeakingTime: data.data.totalSpeakingTime || prev.totalSpeakingTime,
              // Use averages from database if available
              clarityScore: data.data.avgClarityScore || prev.clarityScore,
              accuracy: data.data.avgAccuracy || prev.accuracy,
            }))
          }
        } catch (error) {
          console.error('Failed to load stats from database:', error)
        }
      }

      setIsLoadingStats(false)
    }

    loadStats()
  }, [user?._id])

  // Save session stats to localStorage whenever they change
  useEffect(() => {
    if (!isLoadingStats && sessionStats.attemptCount > 0) {
      try {
        localStorage.setItem('therapySessionStats', JSON.stringify(sessionStats))
      } catch (e) {
        // localStorage not available
      }
    }
  }, [sessionStats, isLoadingStats])

  // Cleanup recorded audio URL when component unmounts or new recording starts
  useEffect(() => {
    return () => {
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl)
      }
    }
  }, [recordedAudioUrl])

  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
    if (sessionIntervalRef.current) {
      clearInterval(sessionIntervalRef.current)
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
  }

  const loadPrompts = async () => {
    try {
      const response = await fetch(`/api/therapy/prompts?difficulty=${difficulty}`)
      const data = await response.json()
      if (data.success && data.data.length > 0) {
        setPrompts(data.data)
        setSelectedPrompt(data.data[0])
      }
    } catch (error) {
      console.error('Failed to load prompts:', error)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const initSpeechRecognition = useCallback(() => {
    if (typeof window === 'undefined') return null

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported')
      return null
    }

    const recognition = new SpeechRecognition()
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
        // Accumulate final transcripts in the ref for accurate analysis
        finalTranscriptRef.current = (finalTranscriptRef.current + ' ' + final).trim()
        setTranscript(prev => [
          ...prev,
          { timestamp: formatTime(sessionTime), text: `You: "${final}"`, type: 'user', keywords: ['You'] }
        ])
      }
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
    }

    return recognition
  }, [sessionTime])

  const startRecording = async () => {
    try {
      // Clear previous recording
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl)
        setRecordedAudioUrl(null)
      }
      setMicrophoneError(null)

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Set up audio context for level monitoring
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)
      analyserRef.current.fftSize = 256

      // Set up media recorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      })

      chunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.start(100)

      // Start speech recognition
      recognitionRef.current = initSpeechRecognition()
      if (recognitionRef.current) {
        recognitionRef.current.start()
      }

      setIsRecording(true)
      setSessionTime(0)
      setInterimTranscript('')
      finalTranscriptRef.current = ''
      setAnalysisResult(null)

      // Start session timer
      sessionIntervalRef.current = setInterval(() => {
        setSessionTime((prev) => prev + 1)
      }, 1000)

      // Add transcript entry
      setTranscript((prev) => [
        ...prev,
        { timestamp: formatTime(0), text: 'Recording started. Speak now...', type: 'system' },
      ])
    } catch (error) {
      console.error('Error accessing microphone:', error)
      let errorMessage = 'Error: Could not access microphone. Please check permissions.'

      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          errorMessage = 'Microphone access denied. Please allow microphone access in your browser settings and refresh the page.'
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No microphone found. Please connect a microphone and try again.'
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Microphone is in use by another application. Please close other apps using the microphone.'
        }
      }

      setMicrophoneError(errorMessage)
      setTranscript((prev) => [
        ...prev,
        { timestamp: formatTime(sessionTime), text: errorMessage, type: 'system' },
      ])
    }
  }

  const stopRecording = async () => {
    setIsRecording(false)
    setIsProcessing(true)

    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    // Stop timer
    if (sessionIntervalRef.current) {
      clearInterval(sessionIntervalRef.current)
    }

    // Stop animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    // Get audio blob from media recorder before stopping
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

    // Save audio blob URL for playback
    if (audioBlob && audioBlob.size > 0) {
      const audioUrl = URL.createObjectURL(audioBlob)
      setRecordedAudioUrl(audioUrl)
    }

    // Stop audio stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }

    // Get the final transcript from the ref (accumulated during recording)
    // Also include any interim transcript that hasn't been finalized
    const transcribedText = (finalTranscriptRef.current + ' ' + interimTranscript).trim()

    setTranscript((prev) => [
      ...prev,
      { timestamp: formatTime(sessionTime), text: 'Recording stopped. Analyzing speech...', type: 'system' },
      { timestamp: formatTime(sessionTime), text: `You said: "${transcribedText || '(nothing detected)'}"`, type: 'user' },
    ])

    // Convert audio blob to base64 for emotion/multimodal analysis
    const getAudioBase64 = async (blob: Blob): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1]
          resolve(base64)
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    }

    // Prepare audio data if available
    let audioBase64 = '';
    if (audioBlob && audioBlob.size > 0) {
      audioBase64 = await getAudioBase64(audioBlob);
    }

    // Run speech analysis and emotion analysis in parallel
    try {
      // Determine the target text based on mode
      const currentTargetText = mode === 'custom' ? customText : selectedPrompt.text;

      const analysisPromise = fetch('/api/therapy/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetText: currentTargetText,
          transcribedText: transcribedText,
          audioData: audioBase64 || undefined, // Send audio for multimodal analysis
        }),
      })

      // Emotion analysis from audio
      let emotionPromise: Promise<Response> | null = null
      if (audioBase64) {
        emotionPromise = fetch('/api/therapy/emotion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64,
            mimeType: 'audio/webm',
          }),
        })
      }

      const [analysisResponse, emotionResponse] = await Promise.all([
        analysisPromise,
        emotionPromise || Promise.resolve(null),
      ])

      const analysisData = await analysisResponse.json()
      const emotionData = emotionResponse ? await emotionResponse.json() : null

      if (analysisData.success) {
        const result = analysisData.data as AnalysisResult

        // Use emotion from audio analysis if available, otherwise fall back to text-based
        const detectedEmotion = emotionData?.success
          ? emotionData.data.emotion
          : result.emotion

        setAnalysisResult({ ...result, emotion: detectedEmotion })
        setCurrentEmotion(detectedEmotion)

        // Update session stats with cumulative tracking
        setSessionStats(prev => {
          const newAttemptCount = prev.attemptCount + 1
          const newTotalClarity = prev.totalClarityScore + result.clarityScore
          const newTotalAccuracy = prev.totalAccuracy + result.accuracy

          // Calculate word count from the actual target text used
          const wordCount = (mode === 'custom' ? customText : selectedPrompt.text).split(' ').length;

          return {
            // Current attempt scores (for display)
            clarityScore: result.clarityScore,
            accuracy: result.accuracy,
            // Cumulative stats
            wordsPracticed: prev.wordsPracticed + wordCount,
            sessionsToday: prev.sessionsToday + 1,
            totalSpeakingTime: prev.totalSpeakingTime + sessionTime,
            totalClarityScore: newTotalClarity,
            totalAccuracy: newTotalAccuracy,
            attemptCount: newAttemptCount,
          }
        })

        // Add analysis to transcript
        setTranscript((prev) => [
          ...prev,
          {
            timestamp: formatTime(sessionTime),
            text: `Analysis complete: ${result.overallScore}% overall score`,
            type: 'analysis',
            keywords: ['Analysis', 'score']
          },
          ...(emotionData?.success ? [{
            timestamp: formatTime(sessionTime),
            text: `Mood detected: ${emotionData.data.emotion} (${emotionData.data.details?.description || ''})`,
            type: 'feedback' as const,
            keywords: ['Mood']
          }] : []),
          ...result.recommendations.slice(0, 2).map((rec, i) => ({
            timestamp: formatTime(sessionTime + i + 1),
            text: `Tip: ${rec}`,
            type: 'feedback' as const,
            keywords: ['Tip']
          })),
        ])

        // Save session if user is logged in
        if (user?._id) {
          await fetch('/api/therapy/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user._id,
              targetText: selectedPrompt.text,
              transcribedText: transcribedText,
              duration: sessionTime,
              accuracy: result.accuracy,
              clarityScore: result.clarityScore,
              overallScore: result.overallScore,
              wordAnalysis: result.wordAnalysis,
              phonemeIssues: result.phonemeIssues,
              recommendations: result.recommendations,
              difficulty: mode === 'custom' ? 'medium' : selectedPrompt.difficulty,
              category: mode === 'custom' ? 'Custom' : selectedPrompt.category,
              emotion: detectedEmotion,
            }),
          })
        }
      }
    } catch (error) {
      console.error('Analysis error:', error)
      setTranscript((prev) => [
        ...prev,
        { timestamp: formatTime(sessionTime), text: 'Analysis failed. Please try again.', type: 'system' },
      ])
    }

    setIsProcessing(false)
    setInterimTranscript('')
  }

  const playReference = async () => {
    if (isPlayingReference) {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      setIsPlayingReference(false)
      return
    }

    setIsPlayingReference(true)

    // Determine the text and voice to use
    const textToPlay = mode === 'custom' ? customText : selectedPrompt.text
    const voiceToUse = mode === 'custom' ? selectedVoice : settings.voiceId

    if (!textToPlay.trim()) {
      setIsPlayingReference(false)
      return
    }

    try {
      const response = await fetch('/api/therapy/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToPlay,
          voiceId: voiceToUse,
          speed: settings.speed,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const audioBlob = new Blob(
          [Uint8Array.from(atob(data.data.audio), c => c.charCodeAt(0))],
          { type: 'audio/mpeg' }
        )
        const audioUrl = URL.createObjectURL(audioBlob)
        audioRef.current = new Audio(audioUrl)
        audioRef.current.playbackRate = settings.speed
        audioRef.current.onended = () => {
          setIsPlayingReference(false)
          URL.revokeObjectURL(audioUrl)
        }
        audioRef.current.play()
      } else {
        // Fallback to browser TTS
        const utterance = new SpeechSynthesisUtterance(selectedPrompt.text)
        utterance.rate = settings.speed
        utterance.onend = () => setIsPlayingReference(false)
        speechSynthesis.speak(utterance)
      }
    } catch (error) {
      console.error('TTS error:', error)
      // Fallback to browser TTS
      const utterance = new SpeechSynthesisUtterance(selectedPrompt.text)
      utterance.rate = settings.speed
      utterance.onend = () => setIsPlayingReference(false)
      speechSynthesis.speak(utterance)
    }
  }

  const playRecording = () => {
    if (!recordedAudioUrl) return

    if (isPlayingRecording && playbackAudioRef.current) {
      playbackAudioRef.current.pause()
      playbackAudioRef.current = null
      setIsPlayingRecording(false)
      return
    }

    setIsPlayingRecording(true)
    playbackAudioRef.current = new Audio(recordedAudioUrl)
    playbackAudioRef.current.onended = () => {
      setIsPlayingRecording(false)
      playbackAudioRef.current = null
    }
    playbackAudioRef.current.onerror = () => {
      setIsPlayingRecording(false)
      playbackAudioRef.current = null
    }
    playbackAudioRef.current.play()
  }

  const selectNextPrompt = () => {
    const currentIndex = prompts.findIndex(p => p.id === selectedPrompt.id)
    const nextIndex = (currentIndex + 1) % prompts.length
    setSelectedPrompt(prompts[nextIndex])
    setAnalysisResult(null)
    setRecordedAudioUrl(null)
    setTranscript([
      { timestamp: '00:00', text: 'New prompt selected. Ready to practice.', type: 'system' },
    ])
  }

  const getWordHighlight = (word: string) => {
    if (!analysisResult) return ''
    const analysis = analysisResult.wordAnalysis.find(
      w => w.word.toLowerCase() === word.toLowerCase().replace(/[.,!?]/g, '')
    )
    if (!analysis) return ''
    switch (analysis.status) {
      case 'correct': return 'bg-success-100 text-success-700'
      case 'incorrect': return 'bg-error-100 text-error-700'
      case 'missing': return 'bg-warning-100 text-warning-700'
      case 'extra': return 'bg-accent-100 text-accent-700'
      default: return ''
    }
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-neutral-900 mb-1">
                Live Therapy Session
              </h1>
              <p className="text-neutral-600">Practice pronunciation with real-time AI feedback</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Difficulty selector */}
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                className="px-3 py-2 rounded-lg border border-neutral-200 text-sm font-medium"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <Badge variant="primary">{selectedPrompt.category}</Badge>
              <Badge
                variant={
                  selectedPrompt.difficulty === 'easy'
                    ? 'success'
                    : selectedPrompt.difficulty === 'medium'
                      ? 'warning'
                      : 'error'
                }
              >
                {selectedPrompt.difficulty}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-6">
            {/* Practice Prompt Card */}
            <div className="glass-card-solid p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-neutral-800">Practice Prompt</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={playReference}
                  disabled={isRecording}
                >
                  {isPlayingReference ? (
                    <>
                      <svg className="w-5 h-5 mr-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                      </svg>
                      Stop
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                      Hear Reference
                    </>
                  )}
                </Button>
              </div>

              {/* Target Text with word highlighting */}
              <div className="bg-gradient-to-br from-primary-50/50 to-secondary-50/30 rounded-2xl p-6 mb-8">
                <p className="text-sm text-neutral-500 mb-3 font-medium">READ THIS:</p>
                <p className="text-2xl font-medium text-neutral-900 leading-relaxed">
                  {selectedPrompt.text.split(' ').map((word, i) => (
                    <span
                      key={i}
                      className={cn(
                        'px-1 rounded transition-colors',
                        getWordHighlight(word)
                      )}
                    >
                      {word}{' '}
                    </span>
                  ))}
                </p>
                {analysisResult && (
                  <div className="mt-4 flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded bg-success-200"></span> Correct
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded bg-error-200"></span> Incorrect
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded bg-warning-200"></span> Missing
                    </span>
                  </div>
                )}
              </div>

              {/* Live transcription display */}
              {(isRecording || interimTranscript) && (
                <div className="bg-neutral-50 rounded-xl p-4 mb-6 border-2 border-dashed border-neutral-200">
                  <p className="text-sm text-neutral-500 mb-2">What we hear:</p>
                  <p className="text-lg text-neutral-700 italic">
                    {interimTranscript || 'Listening...'}
                  </p>
                </div>
              )}

              {/* Audio Waveform Visualization */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-neutral-700">Audio Input</span>
                  {isRecording && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-error-500 animate-pulse" />
                      <span className="text-sm text-neutral-600">{formatTime(sessionTime)}</span>
                    </div>
                  )}
                </div>
                <div className="bg-gradient-to-br from-neutral-50 to-neutral-100/50 rounded-2xl p-6 border border-neutral-200">
                  <AudioWaveform isActive={isRecording} />
                </div>
              </div>

              {/* Recording Controls */}
              <div className="flex items-center justify-center gap-4">
                {!isRecording && !isProcessing ? (
                  <button
                    onClick={startRecording}
                    onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? startRecording() : null}
                    disabled={!browserSupport.microphone || !browserSupport.mediaRecorder}
                    aria-label="Start recording"
                    aria-disabled={!browserSupport.microphone || !browserSupport.mediaRecorder}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 shadow-glow-purple flex items-center justify-center transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h3l3-6 4 12 3-6h5" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-9-9" opacity="0.5" />
                    </svg>
                  </button>
                ) : isProcessing ? (
                  <div className="flex items-center gap-3" role="status" aria-live="polite">
                    <div className="animate-spin w-6 h-6 border-3 border-primary-500 border-t-transparent rounded-full" aria-hidden="true" />
                    <span className="text-neutral-600 font-medium">Analyzing your speech with AI...</span>
                  </div>
                ) : (
                  <button
                    onClick={stopRecording}
                    onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? stopRecording() : null}
                    aria-label="Stop recording and analyze"
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-error-500 to-error-600 hover:from-error-600 hover:to-error-700 shadow-lg flex items-center justify-center transition-all duration-300 animate-pulse focus:outline-none focus:ring-4 focus:ring-error-300"
                  >
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                  </button>
                )}
              </div>
              <p className="text-center mt-4 text-neutral-500" aria-live="polite">
                {!browserSupport.microphone || !browserSupport.mediaRecorder
                  ? 'Recording not supported in this browser'
                  : isRecording
                    ? 'Recording... Click to stop and analyze'
                    : isProcessing
                      ? 'Please wait...'
                      : microphoneError
                        ? microphoneError
                        : 'Click to start recording (or press Space)'}
              </p>

              {/* Playback Recording Button */}
              {recordedAudioUrl && !isRecording && !isProcessing && (
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={playRecording}
                    aria-label={isPlayingRecording ? 'Stop playback' : 'Play your recording'}
                  >
                    {isPlayingRecording ? (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <rect x="6" y="6" width="12" height="12" rx="2" />
                        </svg>
                        Stop Playback
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Hear Your Recording
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* New Multimodal Analysis Section */}
            {analysisResult?.prosody && (
              <Card className="p-6 mb-8 border-l-4 border-l-purple-500 shadow-md bg-white">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  Speaking Style Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Prosody Score */}
                  <div className="bg-purple-50 rounded-xl p-4">
                    <p className="text-sm font-medium text-purple-700 mb-1">Prosody & Flow</p>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-bold text-purple-900">{analysisResult.prosody.score}%</span>
                      <span className="text-sm text-purple-600 mb-1">Naturalness</span>
                    </div>
                    <p className="text-xs text-purple-600 mt-2">{analysisResult.prosody.intonation}</p>
                  </div>

                  {/* Fluency Score */}
                  {analysisResult.fluencyScore !== undefined && (
                    <div className="bg-blue-50 rounded-xl p-4">
                      <p className="text-sm font-medium text-blue-700 mb-1">Fluency</p>
                      <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold text-blue-900">{analysisResult.fluencyScore}%</span>
                        <span className="text-sm text-blue-600 mb-1">Smoothness</span>
                      </div>
                      <div className="w-full bg-blue-200 h-1.5 rounded-full mt-3">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{ width: `${analysisResult.fluencyScore}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Pacing */}
                  <div className="bg-orange-50 rounded-xl p-4">
                    <p className="text-sm font-medium text-orange-700 mb-1">Pacing</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-sm font-medium capitalize",
                        analysisResult.prosody.pacing === 'balanced' ? "bg-green-100 text-green-700" :
                          analysisResult.prosody.pacing === 'fast' ? "bg-orange-100 text-orange-700" :
                            "bg-blue-100 text-blue-700"
                      )}>
                        {analysisResult.prosody.pacing}
                      </span>
                    </div>
                    <p className="text-xs text-orange-600 mt-3">
                      {analysisResult.prosody.pacing === 'balanced' ? 'Perfect speaking rate.' :
                        analysisResult.prosody.pacing === 'fast' ? 'Try slowing down slightly.' :
                          'Try connecting words more fluidly.'}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Analysis Results */}
            {analysisResult && (
              <div className="glass-card-solid p-6">
                <h3 className="text-lg font-semibold text-neutral-800 mb-4">Analysis Results</h3>

                {/* Score Overview */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-primary-600">{analysisResult.overallScore}%</p>
                    <p className="text-sm text-neutral-600">Overall Score</p>
                  </div>
                  <div className="bg-gradient-to-br from-success-50 to-success-100 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-success-600">{analysisResult.accuracy}%</p>
                    <p className="text-sm text-neutral-600">Accuracy</p>
                  </div>
                  <div className="bg-gradient-to-br from-accent-50 to-accent-100 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-accent-600">{analysisResult.clarityScore}%</p>
                    <p className="text-sm text-neutral-600">Clarity</p>
                  </div>
                </div>

                {/* Phoneme Issues */}
                {analysisResult.phonemeIssues.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-neutral-700 mb-3">Focus Areas</h4>
                    <div className="space-y-2">
                      {analysisResult.phonemeIssues.map((issue, i) => (
                        <div key={i} className="bg-warning-50 border border-warning-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono font-bold text-warning-700">&quot;{issue.phoneme}&quot;</span>
                            <span className="text-sm text-neutral-600">in &quot;{issue.word}&quot;</span>
                          </div>
                          <p className="text-sm text-neutral-700">{issue.tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                <div>
                  <h4 className="text-sm font-semibold text-neutral-700 mb-3">Recommendations</h4>
                  <ul className="space-y-2">
                    {analysisResult.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                        <svg className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Live Transcript */}
            <div className="glass-card-solid p-6">
              <h3 className="text-lg font-semibold text-neutral-800 mb-4">Session Log</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {transcript.map((line, index) => (
                  <div key={index} className="flex gap-3">
                    <span className="text-xs text-neutral-400 font-mono mt-1 w-12">{line.timestamp}</span>
                    <div className={cn(
                      'flex-1 text-sm px-3 py-2 rounded-lg',
                      line.type === 'system' && 'bg-neutral-100 text-neutral-600',
                      line.type === 'user' && 'bg-primary-50 text-primary-800',
                      line.type === 'analysis' && 'bg-success-50 text-success-800',
                      line.type === 'feedback' && 'bg-accent-50 text-accent-800',
                    )}>
                      {line.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Live Statistics */}
          <div className="lg:col-span-4 space-y-6">
            {/* Current Emotion */}
            <div className="glass-card-solid p-6">
              <h3 className="text-sm font-semibold text-neutral-600 mb-4">Detected Mood</h3>
              <div className="flex items-center justify-center">
                <EmotionBadge emotion={currentEmotion} size="lg" />
              </div>
              <p className="text-center mt-3 text-neutral-700 font-medium capitalize">{currentEmotion}</p>
            </div>

            {/* Session Statistics */}
            <div className="glass-card-solid p-6">
              <h3 className="text-sm font-semibold text-neutral-600 mb-4">Session Stats</h3>
              <div className="space-y-4">
                <StatCard
                  label="Total Speaking Time"
                  value={formatTime(sessionStats.totalSpeakingTime + (isRecording ? sessionTime : 0))}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />
                <StatCard
                  label="Avg Clarity Score"
                  value={`${sessionStats.attemptCount > 0 ? Math.round(sessionStats.totalClarityScore / sessionStats.attemptCount) : 0}%`}
                  trend={sessionStats.attemptCount > 0 ? (Math.round(sessionStats.totalClarityScore / sessionStats.attemptCount) > 70 ? 'up' : 'down') : 'neutral'}
                  trendValue={sessionStats.clarityScore > 0 ? `Last: ${sessionStats.clarityScore}%` : ''}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  }
                />
                <StatCard
                  label="Avg Accuracy"
                  value={`${sessionStats.attemptCount > 0 ? Math.round(sessionStats.totalAccuracy / sessionStats.attemptCount) : 0}%`}
                  trend={sessionStats.attemptCount > 0 ? (Math.round(sessionStats.totalAccuracy / sessionStats.attemptCount) > 70 ? 'up' : 'down') : 'neutral'}
                  trendValue={sessionStats.accuracy > 0 ? `Last: ${sessionStats.accuracy}%` : ''}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  }
                />
                <StatCard
                  label="Words Practiced"
                  value={sessionStats.wordsPracticed.toString()}
                  trend="neutral"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  }
                />
                <StatCard
                  label="Attempts Today"
                  value={sessionStats.sessionsToday.toString()}
                  trend="neutral"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  }
                />
              </div>
            </div>

            {/* Prompt Selection */}
            <div className="glass-card-solid p-6">
              <h3 className="text-sm font-semibold text-neutral-600 mb-4">Practice Prompts</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {prompts.map((prompt) => (
                  <button
                    key={prompt.id}
                    onClick={() => {
                      setSelectedPrompt(prompt)
                      setAnalysisResult(null)
                    }}
                    disabled={isRecording || isProcessing}
                    className={cn(
                      'w-full text-left p-3 rounded-lg border-2 transition-all text-sm',
                      selectedPrompt.id === prompt.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-neutral-300',
                      (isRecording || isProcessing) && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <p className="text-neutral-800 line-clamp-2">{prompt.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-neutral-500">{prompt.category}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-card-solid p-6">
              <h3 className="text-sm font-semibold text-neutral-600 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  fullWidth
                  size="sm"
                  onClick={selectNextPrompt}
                  disabled={isRecording || isProcessing}
                >
                  Next Prompt
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  size="sm"
                  onClick={loadPrompts}
                  disabled={isRecording || isProcessing}
                >
                  Refresh Prompts
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  size="sm"
                  onClick={() => window.location.href = '/progress'}
                >
                  View Progress
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
