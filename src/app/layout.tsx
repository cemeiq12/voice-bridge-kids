import type { Metadata, Viewport } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { SettingsProvider } from '@/context/SettingsContext'
import { UserProvider } from '@/context/UserContext'
import { ToastProvider } from '@/context/ToastContext'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'VoiceBridge AI - Speech Empowerment Companion',
  description:
    'VoiceBridge AI is a multimodal speech empowerment companion that aids individuals with speech-motor disabilities through real-time speech correction, personalized therapy, and AI-mediated communication.',
  keywords: [
    'speech therapy',
    'dyspraxia',
    'apraxia',
    'stuttering',
    'ALS',
    'speech disability',
    'AI speech',
    'voice assistant',
    'accessibility',
  ],
  authors: [{ name: 'MyndEdge Technical Team' }],
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#778873',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-screen flex flex-col">
        <UserProvider>
          <SettingsProvider>
            <ToastProvider>{children}</ToastProvider>
          </SettingsProvider>
        </UserProvider>
      </body>
    </html>
  )
}
