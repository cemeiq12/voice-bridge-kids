'use client'

import { useState, useRef, useEffect } from 'react'
import { AudioWaveform } from '@/components/ui/AudioWaveform'
import { cn } from '@/lib/utils'

// Web Speech API Types
interface WebSpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    start(): void
    stop(): void
    abort(): void
    onresult: (event: WebSpeechRecognitionEvent) => void
    onerror: (event: WebSpeechRecognitionErrorEvent) => void
}

interface WebSpeechRecognitionEvent {
    resultIndex: number
    results: WebSpeechRecognitionResultList
}

interface WebSpeechRecognitionResultList {
    length: number
    item(index: number): WebSpeechRecognitionResult
    [index: number]: WebSpeechRecognitionResult
}

interface WebSpeechRecognitionResult {
    isFinal: boolean
    length: number
    item(index: number): WebSpeechRecognitionAlternative
    [index: number]: WebSpeechRecognitionAlternative
}

interface WebSpeechRecognitionAlternative {
    transcript: string
    confidence: number
}

interface WebSpeechRecognitionErrorEvent extends Event {
    error: string
    message: string
}

// Types
interface Challenge {
    id: string
    text: string
    type: 'vowel' | 'word'
    icon: string
    color: string
}

interface WordAnalysis {
    word: string
    status: 'correct' | 'incorrect' | 'missing' | 'extra'
    suggestion?: string
}

interface AnalysisResult {
    overallScore: number // 0-100
    recommendations: string[]
    emotion: string
    fluencyScore?: number
    prosody?: {
        score: number
        pacing: 'slow' | 'balanced' | 'fast'
        intonation: string
    }
    wordAnalysis?: WordAnalysis[]
}

interface EmotionReframeResult {
    emotion: string
    reframe: string
    comfortingMessage: string
    emoji: string
}

type PersonaType = 'guide' | 'friend' | 'robot';

interface Persona {
    id: PersonaType;
    name: string;
    icon: string;
    desc: string;
    bg: string;
}

const PERSONAS: Persona[] = [
    { id: 'friend', name: 'Buddy', icon: '🦁', desc: 'Your fun best friend!', bg: 'bg-orange-100 border-orange-200' },
    { id: 'guide', name: 'Wise Owl', icon: '🦉', desc: 'Gentle and wise.', bg: 'bg-emerald-100 border-emerald-200' },
    { id: 'robot', name: 'Robo-Coach', icon: '🤖', desc: 'Super energetic!', bg: 'bg-blue-100 border-blue-200' },
];

interface WorldBuildResult {
    story: string;
    imagePrompt: string;
    image?: string;
}

type PlayScenario = 'magic_clay' | 'grumpy_dragon' | 'picnic';

interface PlayMessage {
    role: 'user' | 'ai';
    content: string;
    action?: string;
}

interface ColorEmotionResult {
    emotion: string;
    validation: string;
    summary: string;
    copingStrategy: string;
}

const CHALLENGES: Challenge[] = [
    // Vowels
    { id: 'a', text: 'A', type: 'vowel', icon: '🍎', color: 'bg-red-400' },
    { id: 'e', text: 'E', type: 'vowel', icon: '🐘', color: 'bg-blue-400' },
    { id: 'i', text: 'I', type: 'vowel', icon: '🍦', color: 'bg-yellow-400' },
    { id: 'o', text: 'O', type: 'vowel', icon: '🐙', color: 'bg-purple-400' },
    { id: 'u', text: 'U', type: 'vowel', icon: '🦄', color: 'bg-pink-400' },
    // Words
    { id: 'cat', text: 'Cat', type: 'word', icon: '🐱', color: 'bg-orange-400' },
    { id: 'dog', text: 'Dog', type: 'word', icon: '🐶', color: 'bg-amber-500' },
    { id: 'sun', text: 'Sun', type: 'word', icon: '☀️', color: 'bg-yellow-300' },
    { id: 'moon', text: 'Moon', type: 'word', icon: '🌙', color: 'bg-indigo-400' },
    { id: 'star', text: 'Star', type: 'word', icon: '⭐', color: 'bg-cyan-300' },
]

export default function KidsPage() {
    const [activeTab, setActiveTab] = useState<'practice' | 'mirror' | 'world' | 'play' | 'color'>('practice')
    const [selectedPersona, setSelectedPersona] = useState<PersonaType>('friend')

    // Practice Mode State
    const [selectedChallenge, setSelectedChallenge] = useState<Challenge>(CHALLENGES[0])
    const [result, setResult] = useState<AnalysisResult | null>(null)

    // Mirror Mode State
    const [mirrorResult, setMirrorResult] = useState<EmotionReframeResult | null>(null)

    // World Builder State
    const [worldResult, setWorldResult] = useState<WorldBuildResult | null>(null)

    // Play Mode State
    const [playScenario, setPlayScenario] = useState<PlayScenario | null>(null)
    const [playHistory, setPlayHistory] = useState<PlayMessage[]>([])

    // Color Reporter State
    const [selectedColor, setSelectedColor] = useState<string | null>(null)
    const [colorResult, setColorResult] = useState<ColorEmotionResult | null>(null)


    // Shared State
    const [isRecording, setIsRecording] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [transcribedText, setTranscribedText] = useState('')

    // Media Recorder Refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const streamRef = useRef<MediaStream | null>(null)
    const recognitionRef = useRef<WebSpeechRecognition | null>(null)

    // Init Speech Recognition
    const initSpeechRecognition = () => {
        if (typeof window === 'undefined') return null

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        if (!SpeechRecognition) return null

        const recognition = new SpeechRecognition() as unknown as WebSpeechRecognition
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'

        recognition.onresult = (event) => {
            let final = ''
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final += event.results[i][0].transcript
                }
            }
            if (final) {
                setTranscribedText(prev => (prev + ' ' + final).trim())
            }
        }

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error)
        }

        return recognition
    }

    // Start Recording
    const startRecording = async () => {
        try {
            setTranscribedText('') // Clear previous text
            setResult(null)
            setMirrorResult(null)
            setWorldResult(null)

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            streamRef.current = stream
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            mediaRecorder.start()
            setIsRecording(true)

            // Start Speech Recognition
            recognitionRef.current = initSpeechRecognition()
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.start()
                } catch (e) {
                    console.error("Recognition start failed", e)
                }
            }

        } catch (err) {
            console.error('Error accessing microphone:', err)
            alert("Uh oh! Can't find the microphone!")
        }
    }

    // Stop Recording (Practice Mode)
    const stopRecording = async () => {
        setIsRecording(false)
        setIsProcessing(true)

        if (recognitionRef.current) recognitionRef.current.stop()
        if (!mediaRecorderRef.current) return

        mediaRecorderRef.current.onstop = async () => {
            const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
            const reader = new FileReader()
            reader.onloadend = async () => {
                const base64 = (reader.result as string).split(',')[1]
                try {
                    const response = await fetch('/api/therapy/analyze', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            targetText: selectedChallenge.text,
                            transcribedText: transcribedText || "(no speech detected)",
                            audioData: base64,
                            audience: 'child',
                            persona: selectedPersona
                        })
                    })
                    const data = await response.json()
                    if (data.success) {
                        setResult(data.data)
                    }
                } catch (error) {
                    console.error("Oops!", error)
                } finally {
                    setIsProcessing(false)
                    streamRef.current?.getTracks().forEach(t => t.stop())
                }
            }
            reader.readAsDataURL(audioBlob)
        }
        mediaRecorderRef.current.stop()
    }

    // Stop Recording (Mirror Mode)
    const stopMirrorRecording = async () => {
        setIsRecording(false)
        setIsProcessing(true)

        if (recognitionRef.current) recognitionRef.current.stop()
        if (!mediaRecorderRef.current) return

        mediaRecorderRef.current.onstop = async () => {
            const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
            const reader = new FileReader()
            reader.onloadend = async () => {
                const base64 = (reader.result as string).split(',')[1]
                try {
                    const response = await fetch('/api/kids/mirror', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            text: transcribedText,
                            audioData: base64,
                            persona: selectedPersona
                        })
                    })
                    const data = await response.json()
                    if (data.success) {
                        setMirrorResult(data.data)
                    }
                } catch (error) {
                    console.error("Mirror error", error)
                } finally {
                    setIsProcessing(false)
                    streamRef.current?.getTracks().forEach(t => t.stop())
                }
            }
            reader.readAsDataURL(audioBlob)
        }
        mediaRecorderRef.current.stop()
    }

    // Stop Recording (World Builder Mode)
    const stopWorldRecording = async () => {
        setIsRecording(false)
        setIsProcessing(true)

        if (recognitionRef.current) recognitionRef.current.stop()
        if (!mediaRecorderRef.current) return

        mediaRecorderRef.current.onstop = async () => {
            const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
            const reader = new FileReader()
            reader.onloadend = async () => {
                const base64 = (reader.result as string).split(',')[1]
                try {
                    const response = await fetch('/api/kids/world-build', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            text: transcribedText,
                            audioData: base64,
                            persona: selectedPersona
                        })
                    })
                    const data = await response.json()
                    if (data.success) {
                        setWorldResult(data.data)
                    }
                } catch (error) {
                    console.error("World Build error", error)
                } finally {
                    setIsProcessing(false)
                    streamRef.current?.getTracks().forEach(t => t.stop())
                }
            }
            reader.readAsDataURL(audioBlob)
        }
        mediaRecorderRef.current.stop()
    }

    // Stop Recording (Play Mode)
    const stopPlayRecording = async () => {
        setIsRecording(false)
        setIsProcessing(true)

        if (recognitionRef.current) recognitionRef.current.stop()
        if (!mediaRecorderRef.current) return

        mediaRecorderRef.current.onstop = async () => {
            const userText = transcribedText || "(some sounds)";

            // Optimistic update
            const newHistory: PlayMessage[] = [...playHistory, { role: 'user', content: userText }];
            setPlayHistory(newHistory);

            setTranscribedText('');

            try {
                const response = await fetch('/api/kids/play', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        scenario: playScenario,
                        childInput: userText,
                        history: newHistory.map(m => m.content),
                        persona: selectedPersona
                    })
                })
                const data = await response.json()
                if (data.success) {
                    setPlayHistory(prev => [...prev, {
                        role: 'ai',
                        content: data.data.message,
                        action: data.data.action
                    }])
                }
            } catch (error) {
                console.error("Play API error", error)
            } finally {
                setIsProcessing(false)
                streamRef.current?.getTracks().forEach(t => t.stop())
            }
        }
        mediaRecorderRef.current.stop()
    }

    // Stop Recording (Color Reporter Mode)
    const stopColorRecording = async () => {
        setIsRecording(false)
        setIsProcessing(true)

        if (recognitionRef.current) recognitionRef.current.stop()
        if (!mediaRecorderRef.current) return

        mediaRecorderRef.current.onstop = async () => {
            const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
            const reader = new FileReader()
            reader.onloadend = async () => {
                const base64 = (reader.result as string).split(',')[1]
                try {
                    const response = await fetch('/api/kids/color-reporter', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            color: selectedColor,
                            audioData: base64,
                            persona: selectedPersona
                        })
                    })
                    const data = await response.json()
                    if (data.success) {
                        setColorResult(data.data)
                    }
                } catch (error) {
                    console.error("Color Reporter error", error)
                } finally {
                    setIsProcessing(false)
                    streamRef.current?.getTracks().forEach(t => t.stop())
                }
            }
            reader.readAsDataURL(audioBlob)
        }
        mediaRecorderRef.current.stop()
    }


    // Cleanup
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop())
            }
            if (recognitionRef.current) {
                recognitionRef.current.stop()
            }
        }
    }, [])

    // Get stars based on score
    const getStars = (score: number) => {
        if (score >= 80) return 3
        if (score >= 50) return 2
        return 1
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 font-rounded">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8 text-center">
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 mb-6 drop-shadow-lg">
                        🎈 Voice Playground 🎈
                    </h1>

                    {/* Persona Selector */}
                    <div className="mb-6 flex justify-center gap-4">
                        {PERSONAS.map(p => (
                            <button
                                key={p.id}
                                onClick={() => setSelectedPersona(p.id)}
                                className={cn(
                                    "px-4 py-2 rounded-2xl flex items-center gap-2 transition-all border-2 backdrop-blur-sm",
                                    p.bg,
                                    selectedPersona === p.id
                                        ? "ring-4 ring-offset-2 ring-offset-slate-900 ring-purple-400 transform scale-105 shadow-lg shadow-purple-500/20"
                                        : "opacity-80 hover:opacity-100 hover:scale-105"
                                )}
                            >
                                <span className="text-2xl">{p.icon}</span>
                                <div className="text-left">
                                    <p className="font-bold text-sm text-gray-700 leading-none">{p.name}</p>
                                    <p className="text-[10px] text-gray-500 font-medium">{p.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Tab Switcher */}
                    <div className="inline-flex bg-slate-800/80 backdrop-blur-sm p-2 rounded-full shadow-lg shadow-purple-500/10 gap-2 border border-slate-700">
                        <button
                            onClick={() => setActiveTab('practice')}
                            className={cn(
                                "px-6 py-3 rounded-full font-bold text-lg transition-all",
                                activeTab === 'practice' ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md shadow-blue-500/30 transform scale-105" : "text-gray-300 hover:bg-slate-700"
                            )}
                        >
                            🎤 Word Fun
                        </button>
                        <button
                            onClick={() => setActiveTab('mirror')}
                            className={cn(
                                "px-6 py-3 rounded-full font-bold text-lg transition-all",
                                activeTab === 'mirror' ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/30 transform scale-105" : "text-gray-300 hover:bg-slate-700"
                            )}
                        >
                            🪞 Magic Mirror
                        </button>
                        <button
                            onClick={() => setActiveTab('world')}
                            className={cn(
                                "px-6 py-3 rounded-full font-bold text-lg transition-all",
                                activeTab === 'world' ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-500/30 transform scale-105" : "text-gray-300 hover:bg-slate-700"
                            )}
                        >
                            🌍 World Builder
                        </button>
                        <button
                            onClick={() => setActiveTab('play')}
                            className={cn(
                                "px-6 py-3 rounded-full font-bold text-lg transition-all",
                                activeTab === 'play' ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/30 transform scale-105" : "text-gray-300 hover:bg-slate-700"
                            )}
                        >
                            🧸 Play Time
                        </button>
                        <button
                            onClick={() => setActiveTab('color')}
                            className={cn(
                                "px-6 py-3 rounded-full font-bold text-lg transition-all",
                                activeTab === 'color' ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/30 transform scale-105" : "text-gray-300 hover:bg-slate-700"
                            )}
                        >
                            🎨 Color Palette
                        </button>
                    </div>
                </header>

                {/* PRACTICE MODE */}
                {activeTab === 'practice' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
                        {/* Left: Challenge Selection */}
                        <div className="space-y-6">
                            <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-slate-700">
                                <h2 className="text-2xl font-bold text-white mb-4 text-center">Pick a Sound!</h2>
                                <div className="grid grid-cols-3 gap-4">
                                    {CHALLENGES.filter(c => c.type === 'vowel').map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => { setSelectedChallenge(c); setResult(null); }}
                                            className={cn(
                                                "aspect-square rounded-2xl flex flex-col items-center justify-center transition-all transform hover:scale-110",
                                                c.color,
                                                selectedChallenge.id === c.id ? "ring-4 ring-offset-2 ring-offset-slate-800 ring-purple-400 scale-105 shadow-lg shadow-purple-500/30" : "opacity-90 hover:opacity-100"
                                            )}
                                        >
                                            <span className="text-4xl mb-1">{c.icon}</span>
                                            <span className="text-2xl font-bold text-white">{c.text}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-slate-700">
                                <h2 className="text-2xl font-bold text-white mb-4 text-center">Pick a Word!</h2>
                                <div className="grid grid-cols-3 gap-4">
                                    {CHALLENGES.filter(c => c.type === 'word').map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => { setSelectedChallenge(c); setResult(null); }}
                                            className={cn(
                                                "aspect-square rounded-2xl flex flex-col items-center justify-center transition-all transform hover:scale-105",
                                                c.color,
                                                selectedChallenge.id === c.id ? "ring-4 ring-offset-2 ring-offset-slate-800 ring-purple-400 scale-105 shadow-lg shadow-purple-500/30" : "opacity-90 hover:opacity-100"
                                            )}
                                        >
                                            <span className="text-4xl mb-1">{c.icon}</span>
                                            <span className="text-lg font-bold text-white">{c.text}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right: Practice Area */}
                        <div className="flex flex-col gap-6">
                            {/* Active Challenge Card */}
                            <div className={cn(
                                "rounded-3xl p-8 shadow-2xl flex flex-col items-center justify-center text-center text-white transition-colors duration-500 min-h-[300px]",
                                selectedChallenge.color
                            )}>
                                <div className="text-9xl mb-4 animate-bounce-slow">{selectedChallenge.icon}</div>
                                <h2 className="text-6xl font-black tracking-wider drop-shadow-md">{selectedChallenge.text}</h2>
                                <p className="text-xl mt-4 font-medium opacity-90">Say "{selectedChallenge.text}"!</p>
                            </div>

                            {/* Controls */}
                            <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-slate-700 text-center">
                                {!result ? (
                                    <>
                                        <div className="mb-6 h-16 bg-slate-700/50 rounded-2xl overflow-hidden flex items-center justify-center">
                                            {isRecording ? (
                                                <AudioWaveform isActive={true} />
                                            ) : (
                                                <span className="text-gray-400 font-bold">Press the Mic!</span>
                                            )}
                                        </div>

                                        <button
                                            onClick={isRecording ? stopRecording : startRecording}
                                            disabled={isProcessing}
                                            className={cn(
                                                "w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-105 active:scale-95",
                                                isRecording ? "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 animate-pulse shadow-red-500/40" : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-blue-500/40"
                                            )}
                                        >
                                            {isProcessing ? (
                                                <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    {isRecording ? (
                                                        <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
                                                    ) : (
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                                    )}
                                                </svg>
                                            )}
                                        </button>
                                    </>
                                ) : (
                                    <div className="animate-in fade-in zoom-in duration-500">
                                        <div className="flex justify-center gap-2 mb-4">
                                            {[1, 2, 3].map((star) => (
                                                <svg
                                                    key={star}
                                                    className={cn(
                                                        "w-16 h-16 transition-all duration-500",
                                                        star <= getStars(result.overallScore) ? "text-yellow-400 fill-yellow-400 animate-bounce" : "text-gray-200"
                                                    )}
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth={2}
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                </svg>
                                            ))}
                                        </div>

                                        <h3 className="text-2xl font-bold text-blue-600 mb-2">
                                            {getStars(result.overallScore) === 3 ? "Wow! Perfect!" : getStars(result.overallScore) === 2 ? "Great job!" : "Good try!"}
                                        </h3>

                                        <div className="bg-sky-50 rounded-xl p-4 mb-6">
                                            {result.recommendations.map((rec, i) => (
                                                <p key={i} className="text-lg text-gray-700 font-medium">✨ {rec}</p>
                                            ))}
                                        </div>

                                        <div className="space-y-4 mb-6 text-left">
                                            {result.wordAnalysis && result.wordAnalysis.length > 0 && (
                                                <div className="bg-white rounded-xl p-4 shadow-sm border border-sky-100">
                                                    <h4 className="font-bold text-sky-600 mb-2">My Words:</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {result.wordAnalysis.map((w, idx) => (
                                                            <span key={idx} className={cn(
                                                                "px-3 py-1 rounded-full font-bold text-lg",
                                                                w.status === 'correct' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500 line-through decoration-2"
                                                            )}>
                                                                {w.word}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-4">
                                                {result.prosody && (
                                                    <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                                                        <p className="text-sm font-bold text-purple-600 mb-1">🎵 Song Score</p>
                                                        <div className="h-4 bg-purple-200 rounded-full overflow-hidden">
                                                            <div className="h-full bg-purple-500 transition-all duration-1000" style={{ width: `${result.prosody.score}%` }} />
                                                        </div>
                                                        <p className="text-xs text-purple-500 mt-1 font-medium">{result.prosody.score > 70 ? "Super Musical!" : "Good Try!"}</p>
                                                    </div>
                                                )}

                                                {result.prosody && (
                                                    <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                                                        <p className="text-sm font-bold text-orange-600 mb-1">🏎️ Speed</p>
                                                        <p className="text-lg font-bold text-orange-500 capitalize">
                                                            {result.prosody.pacing === 'fast' ? '🐇 Too Fast!' :
                                                                result.prosody.pacing === 'slow' ? '🐢 Too Slow' :
                                                                    '🦄 Perfect!'}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setResult(null)}
                                            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition hover:scale-105"
                                        >
                                            Play Again! 🔄
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* MIRROR MODE */}
                {activeTab === 'mirror' && (
                    <div className="max-w-2xl mx-auto animate-in slide-in-from-right duration-500">
                        <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-purple-500/30 text-center">
                            <div className="mb-8">
                                <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto flex items-center justify-center text-6xl shadow-lg shadow-purple-500/30 mb-4 transition-transform hover:scale-110">
                                    {mirrorResult ? mirrorResult.emoji : '🦉'}
                                </div>
                                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                                    {mirrorResult ? "I hear you..." : "Tell me how you feel!"}
                                </h2>
                                <p className="text-xl text-gray-300 font-medium">
                                    {mirrorResult ? "Here is a magic thought:" : "I am listening... Say anything!"}
                                </p>
                            </div>

                            {!mirrorResult ? (
                                <div className="mb-8">
                                    <div className="h-24 bg-slate-700/50 rounded-2xl mb-6 flex items-center justify-center overflow-hidden">
                                        {isRecording ? <AudioWaveform isActive={true} /> : <span className="text-gray-400 font-bold">Press mic & speak (e.g., "I'm sad!")</span>}
                                    </div>
                                    <button
                                        onClick={isRecording ? stopMirrorRecording : startRecording}
                                        disabled={isProcessing}
                                        className={cn(
                                            "w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-110 active:scale-95",
                                            isRecording ? "bg-gradient-to-r from-red-500 to-pink-500 animate-pulse shadow-red-500/40" : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-purple-500/40"
                                        )}
                                    >
                                        {isProcessing ? (
                                            <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <span className="text-5xl">🎙️</span>
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
                                    <div className="bg-purple-50 p-6 rounded-2xl text-left border border-purple-100">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-2xl">🌩️</span>
                                            <span className="font-bold text-purple-400 uppercase text-sm tracking-wider">You felt</span>
                                        </div>
                                        <p className="text-xl font-bold text-gray-700">"{mirrorResult.emotion}"</p>
                                    </div>

                                    <div className="bg-green-50 p-6 rounded-2xl text-left border border-green-100 shadow-md transform scale-105">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-2xl">✨</span>
                                            <span className="font-bold text-green-500 uppercase text-sm tracking-wider">Magic Thought</span>
                                        </div>
                                        <p className="text-2xl font-black text-green-700 mb-2">"{mirrorResult.reframe}"</p>
                                        <p className="text-green-600 italic font-medium">{mirrorResult.comfortingMessage}</p>
                                    </div>

                                    <button
                                        onClick={() => { setMirrorResult(null); setTranscribedText(''); }}
                                        className="bg-purple-500 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-purple-600 transition-all mt-4"
                                    >
                                        Try Again 🔄
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* WORLD BUILDER MODE */}
                {activeTab === 'world' && (
                    <div className="max-w-2xl mx-auto animate-in slide-in-from-right duration-500">
                        <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-indigo-500/30 text-center">
                            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-6">
                                🌍 Magical World Builder
                            </h2>

                            {!worldResult ? (
                                <div className="space-y-8">
                                    <div className="p-6 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
                                        <p className="text-xl text-indigo-200 font-medium mb-4">
                                            Describe your happy place!
                                        </p>
                                        <p className="text-sm text-indigo-300">
                                            "A castle made of candy..."<br />
                                            "A forest where trees can talk..."
                                        </p>
                                    </div>

                                    <div className="h-24 bg-slate-700/50 rounded-2xl mb-6 flex items-center justify-center overflow-hidden">
                                        {isRecording ? <AudioWaveform isActive={true} /> : <span className="text-gray-400 font-bold">Press mic & describe...</span>}
                                    </div>

                                    <button
                                        onClick={isRecording ? stopWorldRecording : startRecording}
                                        disabled={isProcessing}
                                        className={cn(
                                            "w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-110 active:scale-95 mx-auto",
                                            isRecording ? "bg-gradient-to-r from-red-500 to-pink-500 animate-pulse shadow-red-500/40" : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-indigo-500/40"
                                        )}
                                    >
                                        {isProcessing ? (
                                            <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <span className="text-5xl">🎙️</span>
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-8 animate-in slide-in-from-bottom duration-700">
                                    {worldResult.image && (
                                        <div className="rounded-2xl overflow-hidden shadow-lg border-4 border-indigo-200">
                                            <img src={worldResult.image} alt="Your magical world" className="w-full h-auto" />
                                        </div>
                                    )}

                                    <div className="bg-indigo-50 p-6 rounded-2xl text-left border border-indigo-100 shadow-sm">
                                        <h3 className="font-bold text-indigo-500 uppercase text-sm tracking-wider mb-2">Your Story</h3>
                                        <p className="text-lg text-indigo-900 leading-relaxed font-medium">
                                            {worldResult.story}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => { setWorldResult(null); setTranscribedText(''); }}
                                        className="bg-indigo-500 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-indigo-600 transition-all"
                                    >
                                        Build Another World! 🌍
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* PLAY MODE */}
                {activeTab === 'play' && (
                    <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
                        {!playScenario ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <button
                                    onClick={() => { setPlayScenario('magic_clay'); setPlayHistory([]); }}
                                    className="bg-gradient-to-br from-amber-500 to-orange-500 p-6 rounded-3xl shadow-xl hover:scale-105 transition-transform border border-amber-400/50"
                                >
                                    <div className="text-6xl mb-4">🎨</div>
                                    <h3 className="text-xl font-black text-white">Magic Clay</h3>
                                    <p className="text-amber-100 text-sm mt-2">Let's make funny shapes!</p>
                                </button>
                                <button
                                    onClick={() => { setPlayScenario('grumpy_dragon'); setPlayHistory([]); }}
                                    className="bg-gradient-to-br from-red-500 to-rose-500 p-6 rounded-3xl shadow-xl hover:scale-105 transition-transform border border-red-400/50"
                                >
                                    <div className="text-6xl mb-4">🐲</div>
                                    <h3 className="text-xl font-black text-white">Grumpy Dragon</h3>
                                    <p className="text-red-100 text-sm mt-2">Why is he so grumpy?</p>
                                </button>
                                <button
                                    onClick={() => { setPlayScenario('picnic'); setPlayHistory([]); }}
                                    className="bg-gradient-to-br from-green-500 to-emerald-500 p-6 rounded-3xl shadow-xl hover:scale-105 transition-transform border border-green-400/50"
                                >
                                    <div className="text-6xl mb-4">🧂</div>
                                    <h3 className="text-xl font-black text-white">Picnic Party</h3>
                                    <p className="text-green-100 text-sm mt-2">Let's have a snack!</p>
                                </button>
                            </div>
                        ) : (
                            <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl shadow-2xl border border-pink-500/30 overflow-hidden flex flex-col h-[600px]">
                                {/* Chat Header */}
                                <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-4 flex items-center justify-between">
                                    <h3 className="font-black text-white text-xl flex items-center gap-2">
                                        {playScenario === 'magic_clay' ? '🎨 Magic Clay' :
                                            playScenario === 'grumpy_dragon' ? '🐲 Grumpy Dragon' : '🧂 Picnic'}
                                    </h3>
                                    <button
                                        onClick={() => setPlayScenario(null)}
                                        className="text-pink-100 font-bold hover:text-white text-sm"
                                    >
                                        Change Game ↩️
                                    </button>
                                </div>

                                {/* Chat Area */}
                                <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-900/50">
                                    {playHistory.length === 0 && (
                                        <div className="text-center text-gray-400 my-8">
                                            <p className="text-4xl mb-2">🎈</p>
                                            <p>Tap the mic to start playing!</p>
                                        </div>
                                    )}
                                    {playHistory.map((msg, idx) => (
                                        <div key={idx} className={cn(
                                            "flex flex-col max-w-[80%]",
                                            msg.role === 'user' ? "self-end items-end" : "self-start items-start"
                                        )}>
                                            <div className={cn(
                                                "p-4 rounded-2xl text-lg font-medium shadow-sm",
                                                msg.role === 'user'
                                                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-br-none"
                                                    : "bg-slate-700 text-gray-100 border border-slate-600 rounded-bl-none"
                                            )}>
                                                {msg.content}
                                            </div>
                                            {msg.action && (
                                                <span className="text-xs text-gray-500 mt-1 italic pl-2">{msg.action}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Controls */}
                                <div className="p-4 bg-slate-800 border-t border-slate-700 flex items-center justify-center gap-4">
                                    <div className="h-16 flex-1 bg-slate-700/50 rounded-2xl flex items-center justify-center px-4">
                                        {isRecording ? <AudioWaveform isActive={true} /> : <span className="text-gray-400 text-sm">Waiting for you...</span>}
                                    </div>
                                    <button
                                        onClick={isRecording ? stopPlayRecording : startRecording}
                                        disabled={isProcessing}
                                        className={cn(
                                            "w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-105 active:scale-95",
                                            isRecording ? "bg-gradient-to-r from-red-500 to-pink-500 animate-pulse shadow-red-500/40" : "bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-pink-500/40"
                                        )}
                                    >
                                        {isProcessing ? (
                                            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <span className="text-3xl">🎙️</span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* COLOR REPORTER MODE */}
                {activeTab === 'color' && (
                    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
                        <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-teal-500/30 text-center">
                            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400 mb-6">
                                🎨 Color My Feeling
                            </h2>

                            {!selectedColor ? (
                                <div className="grid grid-cols-5 gap-4">
                                    {[
                                        { id: 'Red', color: 'bg-red-500', label: 'Mad / Fast' },
                                        { id: 'Yellow', color: 'bg-yellow-400', label: 'Happy / Silly' },
                                        { id: 'Blue', color: 'bg-blue-400', label: 'Sad / Tired' },
                                        { id: 'Green', color: 'bg-green-500', label: 'Calm / Okay' },
                                        { id: 'Black', color: 'bg-gray-800', label: 'Heavy / Mixed' },
                                    ].map((c) => (
                                        <button
                                            key={c.id}
                                            onClick={() => { setSelectedColor(c.id); setColorResult(null); }}
                                            className={cn(
                                                "aspect-square rounded-full flex flex-col items-center justify-center transition-all transform hover:scale-110 shadow-lg text-white font-bold",
                                                c.color
                                            )}
                                        >
                                            <span className="text-xl drop-shadow-md">{c.id}</span>
                                            <span className="text-xs font-medium opacity-90">{c.label}</span>
                                        </button>
                                    ))}
                                </div>
                                ) : (
                                <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
                                    <div className="flex items-center justify-between bg-teal-500/20 p-4 rounded-xl border border-teal-500/30">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-8 h-8 rounded-full",
                                                selectedColor === 'Red' ? 'bg-red-500' :
                                                    selectedColor === 'Yellow' ? 'bg-yellow-400' :
                                                        selectedColor === 'Blue' ? 'bg-blue-400' :
                                                            selectedColor === 'Green' ? 'bg-green-500' : 'bg-gray-800'
                                            )} />
                                            <span className="font-bold text-white">Reporting a {selectedColor} feeling</span>
                                        </div>
                                        <button onClick={() => setSelectedColor(null)} className="text-gray-400 hover:text-white">Cancel</button>
                                    </div>

                                    {!colorResult ? (
                                        <>
                                            <p className="text-xl text-gray-300 font-medium">
                                                Tell me about your <span className="font-bold text-white">{selectedColor}</span> feeling...
                                            </p>

                                            <div className="h-32 bg-slate-700/50 rounded-2xl mb-6 flex items-center justify-center overflow-hidden">
                                                {isRecording ? <AudioWaveform isActive={true} /> : <span className="text-gray-400 font-bold">Press mic & speak...</span>}
                                            </div>

                                            <button
                                                onClick={isRecording ? stopColorRecording : startRecording}
                                                disabled={isProcessing}
                                                className={cn(
                                                    "w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-110 active:scale-95 mx-auto",
                                                    isRecording ? "bg-gradient-to-r from-red-500 to-pink-500 animate-pulse shadow-red-500/40" : "bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 shadow-teal-500/40"
                                                )}
                                            >
                                                {isProcessing ? (
                                                    <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <span className="text-5xl">🎙️</span>
                                                )}
                                            </button>
                                        </>
                                    ) : (
                                        <div className="space-y-6 text-left">
                                            <div className="bg-teal-50 p-6 rounded-2xl border border-teal-100">
                                                <h3 className="font-bold text-teal-600 mb-2">Feeling Detected:</h3>
                                                <p className="text-2xl font-black text-teal-800">{colorResult.emotion}</p>
                                            </div>

                                            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                                                <h3 className="font-bold text-blue-600 mb-2">Validation:</h3>
                                                <p className="text-lg text-gray-700 italic">"{colorResult.validation}"</p>
                                            </div>

                                            <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-100">
                                                <h3 className="font-bold text-yellow-600 mb-2">Try this:</h3>
                                                <p className="text-lg font-bold text-yellow-800">{colorResult.copingStrategy}</p>
                                            </div>

                                            <div className="mt-8 pt-8 border-t border-gray-100">
                                                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2">Therapist Log (Private)</p>
                                                <div className="bg-gray-50 p-4 rounded-xl text-xs text-gray-500 font-mono">
                                                    {colorResult.summary}
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => { setColorResult(null); setSelectedColor(null); }}
                                                className="w-full bg-teal-500 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-teal-600 transition-all"
                                            >
                                                Report Another Feeling 🎨
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}
