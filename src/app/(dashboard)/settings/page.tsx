'use client'

import { useState, useEffect } from 'react'
import { Button, Card, Badge, Input } from '@/components/ui'
import { useSettings } from '@/context/SettingsContext'
import { useUser } from '@/context/UserContext'
import { useToast } from '@/context/ToastContext'
import { cn } from '@/lib/utils'

// ElevenLabs voice IDs - these are the actual voice IDs from the API
const voiceOptions = [
  {
    id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel',
    description: 'Clear and neutral voice (default)',
    preset: 'THERAPY'
  },
  {
    id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Bella',
    description: 'Warm and empathetic voice',
    preset: 'EMPATHETIC'
  },
  {
    id: 'pNInz6obpgDQGcFmaJgB',
    name: 'Adam',
    description: 'Professional and confident voice',
    preset: 'PROFESSIONAL'
  },
  {
    id: 'ThT5KcBeYPX3keUQqHPh',
    name: 'Dorothy',
    description: 'Calm and soothing voice',
    preset: 'CALM'
  },
]

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings, loadUserSettings } = useSettings()
  const { user, updateProfile, updateDisabilityProfile } = useUser()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<'profile' | 'accessibility' | 'voice'>('profile')
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [hasLoadedUserSettings, setHasLoadedUserSettings] = useState(false)

  // Sync SettingsContext with user's database settings when user first loads
  useEffect(() => {
    if (user?.settings && !hasLoadedUserSettings) {
      loadUserSettings(user.settings)
      setHasLoadedUserSettings(true)
    }
  }, [user?.settings, hasLoadedUserSettings, loadUserSettings])

  const handleSaveProfile = async () => {
    if (!user?._id) {
      toast.error('You must be logged in to update your profile')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user._id,
          name: user.name,
          email: user.email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      toast.success('Profile updated successfully')
    } catch (error: any) {
      console.error('Profile update error:', error)
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveDisabilityProfile = async () => {
    if (!user?._id) {
      toast.error('You must be logged in to update your disability profile')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/user/disability-profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user._id,
          type: user.disabilityProfile?.type,
          severity: user.disabilityProfile?.severity,
          triggerWords: user.disabilityProfile?.triggerWords,
          description: user.disabilityProfile?.description,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update disability profile')
      }

      toast.success('Disability profile updated successfully')
    } catch (error: any) {
      console.error('Disability profile update error:', error)
      toast.error(error.message || 'Failed to update disability profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!user?._id) {
      toast.error('You must be logged in to update settings')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user._id,
          voiceId: settings.voiceId,
          speed: settings.speed,
          fontMode: settings.fontMode,
          textSize: settings.textSize,
          highContrast: settings.highContrast,
          reducedMotion: settings.reducedMotion,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update settings')
      }

      // Update user context with new settings from server
      updateProfile({ settings: data.data.settings })

      toast.success('Settings saved successfully')
    } catch (error: any) {
      console.error('Settings update error:', error)
      toast.error(error.message || 'Failed to update settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSave = async () => {
    // Save all settings based on active tab
    if (activeTab === 'profile') {
      await handleSaveProfile()
      await handleSaveDisabilityProfile()
    } else if (activeTab === 'accessibility') {
      await handleSaveSettings()
    } else if (activeTab === 'voice') {
      await handleSaveSettings()
    }
  }

  const handleResetSettings = () => {
    resetSettings()
    toast.info('Settings reset to defaults')
  }

  const handleTestVoice = async () => {
    setIsTesting(true)
    try {
      const testText = 'Hello! This is a sample of your selected voice settings. VoiceBridge AI is here to help you communicate with confidence.'

      // Get the selected voice ID from settings, default to Rachel if not set
      const selectedVoiceId = settings.voiceId || '21m00Tcm4TlvDq8ikWAM'

      // Use ElevenLabs TTS API with the selected voice
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: testText,
          voiceId: selectedVoiceId,
          stability: 0.5,
          similarityBoost: 0.75,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate speech')
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)

      // Apply speed setting
      audio.playbackRate = settings.speed

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl)
        setIsTesting(false)
      }

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl)
        setIsTesting(false)
        toast.error('Failed to play audio')
      }

      audio.play()
    } catch (error: any) {
      console.error('Voice test error:', error)
      toast.error(error.message || 'Failed to test voice')
      setIsTesting(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'accessibility', label: 'Accessibility', icon: '♿' },
    { id: 'voice', label: 'Voice Settings', icon: '🎙️' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-neutral-900 mb-2">
          Settings
        </h1>
        <p className="text-neutral-600">
          Customize VoiceBridge to work best for you.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              'flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-primary-100 text-primary-700'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            )}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <Card>
            <h2 className="font-semibold text-xl text-neutral-800 mb-6">
              Personal Information
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <Input
                label="Full Name"
                value={user?.name || ''}
                onChange={(e) => updateProfile({ name: e.target.value })}
                placeholder="Your name"
              />
              <Input
                label="Email"
                type="email"
                value={user?.email || ''}
                onChange={(e) => updateProfile({ email: e.target.value })}
                placeholder="Your email"
              />
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold text-xl text-neutral-800 mb-6">
              Speech Profile
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-3">
                  Condition Type
                </label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { value: 'dyspraxia', label: 'Dyspraxia' },
                    { value: 'apraxia', label: 'Apraxia' },
                    { value: 'stuttering', label: 'Stuttering' },
                    { value: 'als', label: 'ALS / Motor Neuron' },
                    { value: 'other', label: 'Other' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() =>
                        updateDisabilityProfile({ type: type.value as any })
                      }
                      className={cn(
                        'p-4 rounded-xl border-2 text-left transition-all',
                        user?.disabilityProfile?.type === type.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      )}
                    >
                      <span className="font-medium text-neutral-800">
                        {type.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-3">
                  Severity Level: {user?.disabilityProfile?.severity || 5}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={user?.disabilityProfile?.severity || 5}
                  onChange={(e) =>
                    updateDisabilityProfile({
                      severity: parseInt(e.target.value),
                    })
                  }
                  className="w-full h-3 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-primary-500"
                />
                <div className="flex justify-between text-sm text-neutral-500 mt-2">
                  <span>Mild</span>
                  <span>Severe</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-3">
                  Trigger Words (comma separated)
                </label>
                <Input
                  value={user?.disabilityProfile?.triggerWords?.join(', ') || ''}
                  onChange={(e) =>
                    updateDisabilityProfile({
                      triggerWords: e.target.value
                        .split(',')
                        .map((w) => w.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="e.g., specifically, particularly, communication"
                  hint="Words you find particularly challenging"
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Accessibility Tab */}
      {activeTab === 'accessibility' && (
        <div className="space-y-6">
          <Card>
            <h2 className="font-semibold text-xl text-neutral-800 mb-6">
              Display Settings
            </h2>
            <div className="space-y-6">
              {/* Font Style */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-3">
                  Font Style
                </label>
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    { value: 'default', label: 'Default', sample: 'Aa Bb Cc' },
                    { value: 'dyslexic', label: 'OpenDyslexic', sample: 'Aa Bb Cc' },
                    { value: 'hyperlegible', label: 'Atkinson Hyperlegible', sample: 'Aa Bb Cc' },
                  ].map((font) => (
                    <button
                      key={font.value}
                      onClick={() =>
                        updateSettings({ fontMode: font.value as any })
                      }
                      className={cn(
                        'p-4 rounded-xl border-2 text-center transition-all',
                        settings.fontMode === font.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      )}
                    >
                      <span
                        className={cn(
                          'text-2xl block mb-2',
                          font.value === 'dyslexic' && 'font-dyslexic',
                          font.value === 'hyperlegible' && 'font-hyperlegible'
                        )}
                      >
                        {font.sample}
                      </span>
                      <span className="text-sm font-medium text-neutral-700">
                        {font.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Size */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-3">
                  Text Size
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'normal', label: 'Normal', size: 'text-base' },
                    { value: 'large', label: 'Large', size: 'text-lg' },
                    { value: 'extra-large', label: 'Extra Large', size: 'text-xl' },
                  ].map((size) => (
                    <button
                      key={size.value}
                      onClick={() =>
                        updateSettings({ textSize: size.value as any })
                      }
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all',
                        settings.textSize === size.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      )}
                    >
                      <span className={cn('font-medium text-neutral-700', size.size)}>
                        {size.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggle Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                  <div>
                    <p className="font-medium text-neutral-800">High Contrast</p>
                    <p className="text-sm text-neutral-500">
                      Increase contrast for better visibility
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      updateSettings({ highContrast: !settings.highContrast })
                    }
                    className={cn(
                      'w-14 h-8 rounded-full transition-colors relative',
                      settings.highContrast ? 'bg-primary-500' : 'bg-neutral-300'
                    )}
                  >
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full bg-white shadow absolute top-1 transition-all',
                        settings.highContrast ? 'right-1' : 'left-1'
                      )}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                  <div>
                    <p className="font-medium text-neutral-800">Reduced Motion</p>
                    <p className="text-sm text-neutral-500">
                      Minimize animations and transitions
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      updateSettings({ reducedMotion: !settings.reducedMotion })
                    }
                    className={cn(
                      'w-14 h-8 rounded-full transition-colors relative',
                      settings.reducedMotion ? 'bg-primary-500' : 'bg-neutral-300'
                    )}
                  >
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full bg-white shadow absolute top-1 transition-all',
                        settings.reducedMotion ? 'right-1' : 'left-1'
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-primary-50 to-secondary-50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">♿</span>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-800 mb-2">
                  WCAG 2.1 AAA Compliant
                </h3>
                <p className="text-sm text-neutral-600">
                  VoiceBridge AI follows the highest accessibility standards,
                  including 7:1 contrast ratios and 48x48px minimum touch targets.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Voice Settings Tab */}
      {activeTab === 'voice' && (
        <div className="space-y-6">
          <Card>
            <h2 className="font-semibold text-xl text-neutral-800 mb-6">
              Voice Selection
            </h2>
            <p className="text-sm text-neutral-600 mb-4">
              Choose a voice for ElevenLabs text-to-speech. This will be used in therapy mode, bridge mode, and voice testing.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {voiceOptions.map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => updateSettings({ voiceId: voice.id })}
                  className={cn(
                    'p-4 rounded-xl border-2 text-left transition-all',
                    settings.voiceId === voice.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-neutral-800">
                      {voice.name}
                    </span>
                    {settings.voiceId === voice.id && (
                      <Badge variant="primary" size="sm">Selected</Badge>
                    )}
                  </div>
                  <p className="text-sm text-neutral-500">{voice.description}</p>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold text-xl text-neutral-800 mb-6">
              Speaking Speed
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-neutral-600">Speed: {settings.speed}x</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateSettings({ speed: 0.75 })}
                    className={cn(
                      "px-3 py-1 rounded-full text-sm font-medium transition-colors",
                      settings.speed === 0.75
                        ? "bg-primary-500 text-white"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    )}
                  >
                    Slower
                  </button>
                  <button
                    onClick={() => updateSettings({ speed: 1.0 })}
                    className={cn(
                      "px-3 py-1 rounded-full text-sm font-medium transition-colors",
                      settings.speed === 1.0
                        ? "bg-primary-500 text-white"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    )}
                  >
                    Normal
                  </button>
                  <button
                    onClick={() => updateSettings({ speed: 1.25 })}
                    className={cn(
                      "px-3 py-1 rounded-full text-sm font-medium transition-colors",
                      settings.speed === 1.25
                        ? "bg-primary-500 text-white"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    )}
                  >
                    Faster
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={settings.speed}
                onChange={(e) =>
                  updateSettings({ speed: parseFloat(e.target.value) })
                }
                className="w-full h-3 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-primary-500"
              />
              <div className="flex justify-between text-sm text-neutral-500">
                <span>0.5x</span>
                <span>1.0x</span>
                <span>1.5x</span>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold text-xl text-neutral-800 mb-4">
              Test Your Voice
            </h2>
            <p className="text-neutral-600 mb-4">
              Click the button below to hear a sample with your current voice and speed settings using ElevenLabs.
            </p>
            <Button onClick={handleTestVoice} isLoading={isTesting}>
              {isTesting ? (
                'Playing...'
              ) : (
                <>
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Play Sample
                </>
              )}
            </Button>
          </Card>
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <Button variant="ghost" onClick={handleResetSettings}>
          Reset to Defaults
        </Button>
        <Button onClick={handleSave} isLoading={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
