// User related types
export interface User {
  _id: string
  email: string
  name: string
  avatar?: string
  disabilityProfile: DisabilityProfile
  settings: UserSettings
  createdAt: string
  updatedAt: string
}

export interface DisabilityProfile {
  type: 'dyspraxia' | 'apraxia' | 'stuttering' | 'als' | 'other'
  severity: number // 1-10
  triggerWords: string[]
  description?: string
}

export interface UserSettings {
  voiceId: string
  speed: number // 0.5 - 1.5
  fontMode: 'default' | 'dyslexic' | 'hyperlegible'
  textSize: 'normal' | 'large' | 'extra-large'
  highContrast: boolean
  reducedMotion: boolean
}

// Practice session types
export interface PracticeSession {
  _id: string
  userId: string
  date: string
  score: number
  duration: number // in seconds
  targetText: string
  transcribedText: string
  strugglePhonemes: string[]
  audioUrl?: string
  feedback: PracticeFeedback[]
}

export interface PracticeFeedback {
  word: string
  status: 'correct' | 'incorrect' | 'missing' | 'extra'
  suggestion?: string
}

// Phoneme guide types
export interface PhonemeGuide {
  id: string
  phoneme: string
  name: string
  category: 'Fricatives' | 'Liquids' | 'Affricates' | 'Stops' | 'Nasals' | 'Glides'
  difficulty: 'easy' | 'medium' | 'hard'
  description: string
  tonguePosition: string
  lipPosition: string
  airflow: string
  examples: string[]
  tips: string[]
  commonMistakes: string[]
  svgAnimation?: string
}

export interface PhonemeProgress {
  userId: string
  phonemeId: string
  progress: number // 0-100
  practiceCount: number
  lastPracticedAt: string
  accuracyHistory: number[]
  createdAt: string
  updatedAt: string
}

// Speech analysis types
export interface SpeechAnalysisResult {
  transcribedText: string
  targetText: string
  accuracy: number
  wordFeedback: WordFeedback[]
  phonemeIssues: PhonemeIssue[]
  overallScore: number
  latencyMs: number
}

export interface WordFeedback {
  word: string
  status: 'correct' | 'incorrect' | 'missing' | 'extra'
  position: number
  suggestion?: string
}

export interface PhonemeIssue {
  phoneme: string
  word: string
  frequency: number
}

// Bridge mode types
export interface BridgeSession {
  id: string
  startTime: string
  endTime?: string
  exchanges: BridgeExchange[]
}

export interface BridgeExchange {
  id: string
  timestamp: string
  rawInput: string
  correctedText: string
  audioUrl?: string
  confidence: number
}

// Progress tracking types
export interface ProgressStats {
  totalSessions: number
  totalPracticeTime: number
  averageScore: number
  improvedPhonemes: string[]
  strugglePhonemes: string[]
  weeklyProgress: WeeklyProgress[]
  achievements: Achievement[]
}

export interface WeeklyProgress {
  week: string
  sessions: number
  averageScore: number
  practiceMinutes: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt?: string
  progress: number // 0-100
}

// API response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Practice prompts
export interface PracticePrompt {
  id: string
  text: string
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  targetPhonemes: string[]
}
