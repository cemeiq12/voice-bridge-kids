'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react'
import type { UserSettings } from '@/types'

interface SettingsContextType {
  settings: UserSettings
  updateSettings: (updates: Partial<UserSettings>) => void
  resetSettings: () => void
  loadUserSettings: (userSettings: UserSettings) => void
}

const defaultSettings: UserSettings = {
  voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel - default ElevenLabs voice
  speed: 1.0,
  fontMode: 'default',
  textSize: 'normal',
  highContrast: false,
  reducedMotion: false,
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('voicebridge-settings')
    const storedUser = localStorage.getItem('voicebridge-user')

    // Prefer user settings from database over localStorage settings
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        if (user.settings) {
          setSettings(user.settings)
        } else if (stored) {
          setSettings(JSON.parse(stored))
        }
      } catch {
        console.error('Failed to parse stored user')
        if (stored) {
          try {
            setSettings(JSON.parse(stored))
          } catch {
            console.error('Failed to parse stored settings')
          }
        }
      }
    } else if (stored) {
      try {
        setSettings(JSON.parse(stored))
      } catch {
        console.error('Failed to parse stored settings')
      }
    }
    setIsLoaded(true)
  }, [])

  // Save settings to localStorage when they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('voicebridge-settings', JSON.stringify(settings))
    }
  }, [settings, isLoaded])

  // Apply settings to document
  useEffect(() => {
    if (!isLoaded) return

    const html = document.documentElement
    const body = document.body

    // Remove all font mode classes
    body.classList.remove('font-mode-dyslexic', 'font-mode-hyperlegible')

    // Apply font mode
    if (settings.fontMode === 'dyslexic') {
      body.classList.add('font-mode-dyslexic')
    } else if (settings.fontMode === 'hyperlegible') {
      body.classList.add('font-mode-hyperlegible')
    }

    // Apply text size
    body.classList.remove('text-mode-large', 'text-mode-extra-large')
    if (settings.textSize === 'large') {
      body.classList.add('text-mode-large')
    } else if (settings.textSize === 'extra-large') {
      body.classList.add('text-mode-extra-large')
    }

    // Apply high contrast
    body.classList.toggle('contrast-mode-high', settings.highContrast)

    // Apply reduced motion
    if (settings.reducedMotion) {
      html.setAttribute('data-motion-reduce', 'reduce')
    } else {
      html.removeAttribute('data-motion-reduce')
    }
  }, [settings, isLoaded])

  const updateSettings = (updates: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }))
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
  }

  const loadUserSettings = (userSettings: UserSettings) => {
    setSettings(userSettings)
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, loadUserSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
