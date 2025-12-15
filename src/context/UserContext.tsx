'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react'
import type { User, DisabilityProfile } from '@/types'

interface UserContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  updateProfile: (updates: Partial<User>) => void
  updateDisabilityProfile: (profile: Partial<DisabilityProfile>) => void
  setUserFromVerification: (userData: User) => void
}

interface RegisterData {
  email: string
  password: string
  name: string
  disabilityType: DisabilityProfile['type']
  severity: number
}

const UserContext = createContext<UserContextType | undefined>(undefined)

// Default settings for new users
const defaultSettings = {
  voiceId: 'default',
  speed: 1.0,
  fontMode: 'default' as const,
  textSize: 'normal' as const,
  highContrast: false,
  reducedMotion: false,
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored session
    const stored = localStorage.getItem('voicebridge-user')
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        console.error('Failed to parse stored user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      const loggedInUser: User = {
        _id: data.data.id,
        email: data.data.email,
        name: data.data.name,
        disabilityProfile: data.data.disabilityProfile,
        settings: data.data.settings || defaultSettings,
        createdAt: data.data.createdAt,
        updatedAt: data.data.updatedAt,
      }

      setUser(loggedInUser)
      localStorage.setItem('voicebridge-user', JSON.stringify(loggedInUser))
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterData) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          disabilityType: data.disabilityType,
          severity: data.severity,
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || 'Registration failed')
      }

      // User is registered but not verified yet
      // The register page will redirect to verification
    } finally {
      setIsLoading(false)
    }
  }

  const setUserFromVerification = (userData: User) => {
    // Ensure settings have defaults
    const userWithDefaults: User = {
      ...userData,
      settings: userData.settings || defaultSettings,
    }
    setUser(userWithDefaults)
    localStorage.setItem('voicebridge-user', JSON.stringify(userWithDefaults))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('voicebridge-user')
  }

  const updateProfile = (updates: Partial<User>) => {
    if (!user) return
    const updated = { ...user, ...updates, updatedAt: new Date().toISOString() }
    setUser(updated)
    localStorage.setItem('voicebridge-user', JSON.stringify(updated))
  }

  const updateDisabilityProfile = (profile: Partial<DisabilityProfile>) => {
    if (!user) return
    const updated = {
      ...user,
      disabilityProfile: { ...user.disabilityProfile, ...profile },
      updatedAt: new Date().toISOString(),
    }
    setUser(updated)
    localStorage.setItem('voicebridge-user', JSON.stringify(updated))
  }

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateProfile,
        updateDisabilityProfile,
        setUserFromVerification,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
