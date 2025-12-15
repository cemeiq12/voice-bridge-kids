'use client'

import Link from 'next/link'

// Animated waveform component for hero
function WaveformVisualization() {
  return (
    <div className="flex items-center justify-center gap-1 h-32">
      {[...Array(24)].map((_, i) => (
        <div
          key={i}
          className="w-1.5 bg-current rounded-full waveform-bar-landing"
          style={{
            height: '100%',
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
    </div>
  )
}

// Floating particles background
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-sage-medium/20 rounded-full floating-particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${8 + Math.random() * 4}s`,
          }}
        />
      ))}
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="bg-neutral-900">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            {/* Left - Navigation Links */}
            <div className="hidden md:flex items-center gap-8 flex-1">
              <Link href="/therapy" className="text-white/60 hover:text-white tracking-[0.15em] uppercase text-xs transition-colors !min-h-0">
                Therapy
              </Link>
              <Link href="/bridge" className="text-white/60 hover:text-white tracking-[0.15em] uppercase text-xs transition-colors !min-h-0">
                Bridge
              </Link>
              <Link href="/guides" className="text-white/60 hover:text-white tracking-[0.15em] uppercase text-xs transition-colors !min-h-0">
                Guides
              </Link>
            </div>

            {/* Center - Logo */}
            <Link href="/" className="group">
              <div className="w-12 h-12 bg-gradient-to-br from-sage-medium to-sage-dark rounded-2xl flex items-center justify-center shadow-glow-sage group-hover:scale-105 transition-transform">
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
            </Link>

            {/* Right - Auth Links */}
            <div className="hidden md:flex items-center justify-end gap-8 flex-1">
              <Link
                href="/login"
                className="text-white/60 hover:text-white tracking-[0.15em] uppercase text-xs transition-colors !min-h-0"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="px-6 py-3 border border-white/30 text-white/80 hover:bg-white hover:text-neutral-900 tracking-[0.15em] uppercase text-xs transition-all"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden text-white/60 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Section 1: Hero - Dark */}
      <section className="relative h-screen flex items-center justify-center bg-neutral-900 overflow-hidden">
        <FloatingParticles />
        
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sage-medium/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-500/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 text-center px-6 max-w-6xl mx-auto pt-20">
          <h1 className="text-6xl sm:text-7xl lg:text-9xl font-black text-white leading-[0.9] tracking-tighter mb-8">
            YOUR VOICE
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sage-light via-sage-medium to-accent-400">
              UNDERSTOOD
            </span>
              </h1>
          
          <p className="text-xl sm:text-2xl text-white/60 max-w-2xl mx-auto mb-12 leading-relaxed">
            Real-time speech correction and personalized therapy for individuals 
            with speech-motor disabilities.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="group bg-white text-neutral-900 px-8 py-4 rounded-full font-bold text-lg flex items-center gap-3 hover:gap-5 transition-all hover:shadow-glow-sage"
            >
                    Start Your Journey
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                </Link>
          </div>
          
          {/* Animated waveform */}
          <div className="mt-6 text-sage-medium/30">
            <WaveformVisualization />
              </div>
            </div>

        {/* AI-Powered Label - Vertical Side Text */}
        <div className="hidden lg:flex absolute left-8 top-1/2 -translate-y-1/2 flex-col items-center gap-4">
          <div className="w-px h-16 bg-gradient-to-b from-transparent via-sage-medium to-transparent" />
          <span className="text-white/40 text-xs tracking-[0.3em] uppercase vertical-text">
            AI-Powered
          </span>
          <div className="w-2 h-2 bg-sage-medium rounded-full animate-pulse" />
          <span className="text-white/40 text-xs tracking-[0.3em] uppercase vertical-text">
            Speech Companion
          </span>
          <div className="w-px h-16 bg-gradient-to-b from-sage-medium via-transparent to-transparent" />
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50 animate-bounce">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Section 2: How It Works - Light */}
      <section className="relative min-h-screen flex items-center bg-sage-cream py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-sage-dark font-mono text-sm tracking-widest uppercase mb-4 block">
                How It Works
              </span>
              <h2 className="text-5xl lg:text-7xl font-black text-neutral-900 leading-[0.95] tracking-tight mb-6">
                SPEAK.
                <br />
                <span className="text-sage-dark">CORRECT.</span>
                <br />
                COMMUNICATE.
              </h2>
              <p className="text-xl text-neutral-600 leading-relaxed mb-8">
                VoiceBridge AI listens to your speech, understands your intent, 
                and helps you communicate clearly—all in real-time.
              </p>
              
              <div className="space-y-6">
                {[
                  { step: '01', title: 'You Speak', desc: 'Talk naturally into your device' },
                  { step: '02', title: 'AI Processes', desc: 'Our AI understands your intent' },
                  { step: '03', title: 'Clear Output', desc: 'Hear your words spoken clearly' },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4 group">
                    <span className="text-4xl font-black text-sage-light group-hover:text-sage-medium transition-colors">
                      {item.step}
                    </span>
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900">{item.title}</h3>
                      <p className="text-neutral-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-sage-medium to-sage-dark rounded-3xl p-8 flex items-center justify-center">
                <div className="bg-white rounded-2xl p-8 shadow-elevated w-full max-w-sm">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-sage-medium to-sage-dark rounded-full mx-auto mb-6 flex items-center justify-center shadow-glow-sage">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </div>
                    <p className="text-neutral-400 text-sm mb-2">You said:</p>
                    <p className="text-neutral-500 line-through mb-4">&quot;I... w-want... c-coffee&quot;</p>
                    <p className="text-neutral-400 text-sm mb-2">VoiceBridge says:</p>
                    <p className="text-neutral-900 font-semibold text-lg">&quot;I would like a coffee, please.&quot;</p>
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-sage-light rounded-full opacity-50" />
              <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-accent-300 rounded-full opacity-50" />
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Features - Dark */}
      <section className="relative min-h-screen flex items-center bg-neutral-900 py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
          <div className="text-center mb-20">
            <span className="text-sage-medium font-mono text-sm tracking-widest uppercase mb-4 block">
              Two Powerful Modes
            </span>
            <h2 className="text-5xl lg:text-7xl font-black text-white leading-[0.95] tracking-tight">
              THE INTELLIGENCE LAYER
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sage-light to-accent-400">
                FOR CLEAR SPEECH
              </span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Therapy Mode */}
            <div className="group bg-gradient-to-br from-sage-dark/30 to-transparent border border-sage-medium/20 rounded-3xl p-10 hover:border-sage-medium/40 transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-sage-medium to-sage-dark rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <span className="text-sage-medium font-mono text-xs tracking-widest">01</span>
                  <h3 className="text-3xl font-bold text-white">Therapy Mode</h3>
                </div>
              </div>
              <p className="text-white/60 text-lg leading-relaxed mb-8">
                Practice specific words and receive immediate feedback on pronunciation 
                and rhythm. Visual highlights show exactly which syllables need improvement.
              </p>
              <ul className="space-y-4">
                {['Real-time pronunciation feedback', 'Visual tongue/lip placement guides', 'AI-generated reference audio'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-white/80">
                    <svg className="w-5 h-5 text-sage-medium flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                    {item}
                </li>
                ))}
              </ul>
            </div>

            {/* Bridge Mode */}
            <div className="group bg-gradient-to-br from-accent-600/30 to-transparent border border-accent-500/20 rounded-3xl p-10 hover:border-accent-500/40 transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-accent-700 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <span className="text-accent-400 font-mono text-xs tracking-widest">02</span>
                  <h3 className="text-3xl font-bold text-white">Bridge Mode</h3>
                </div>
              </div>
              <p className="text-white/60 text-lg leading-relaxed mb-8">
                Live translation of your speech into clear, synthesized audio. 
                Let your phone speak for you when you need it most.
              </p>
              <ul className="space-y-4">
                {['Real-time speech correction', 'Natural-sounding voice output', 'Under 800ms latency'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-white/80">
                    <svg className="w-5 h-5 text-accent-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                    {item}
                </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Who It's For - Light */}
      <section className="relative min-h-screen flex items-center bg-white py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
          <div className="text-center mb-20">
            <span className="text-sage-dark font-mono text-sm tracking-widest uppercase mb-4 block">
              Built For Those Who Need It
            </span>
            <h2 className="text-5xl lg:text-7xl font-black text-neutral-900 leading-[0.95] tracking-tight mb-6">
              EMPOWERING
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sage-medium to-accent-500">
                EVERY VOICE
              </span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { 
                name: 'Dyspraxia', 
                desc: 'Difficulty coordinating mouth movements',
                gradient: 'from-sage-medium to-sage-dark'
              },
              { 
                name: 'Apraxia', 
                desc: 'Challenges in planning speech movements',
                gradient: 'from-accent-500 to-accent-700'
              },
              { 
                name: 'Stuttering', 
                desc: 'Disruptions in the flow of speech',
                gradient: 'from-sage-light to-sage-medium'
              },
              { 
                name: 'ALS', 
                desc: 'Progressive weakening of speech muscles',
                gradient: 'from-sage-dark to-accent-600'
              },
              { 
                name: "Parkinson's", 
                desc: 'Soft or mumbled speech',
                gradient: 'from-accent-400 to-sage-dark'
              },
              { 
                name: 'Other Conditions', 
                desc: 'Any speech-motor disability',
                gradient: 'from-sage-medium to-accent-500'
              },
            ].map((condition) => (
              <div
                key={condition.name}
                className="group bg-neutral-50 hover:bg-white border border-neutral-100 hover:border-sage-light rounded-2xl p-8 transition-all hover:shadow-elevated"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${condition.gradient} rounded-xl mb-6 flex items-center justify-center group-hover:scale-110 transition-transform shadow-soft`}>
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-2">{condition.name}</h3>
                <p className="text-neutral-600">{condition.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: CTA - Dark */}
      <section className="relative min-h-[80vh] flex items-center bg-neutral-900 py-32 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sage-medium/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-5xl lg:text-8xl font-black text-white leading-[0.9] tracking-tight mb-8">
            READY TO BE
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sage-light via-sage-medium to-accent-400">
              HEARD?
            </span>
          </h2>
          <p className="text-xl text-white/60 max-w-xl mx-auto mb-12 leading-relaxed">
            Start your journey to clearer communication today. 
            VoiceBridge AI is here to empower your voice.
          </p>
          <Link
            href="/register"
            className="group inline-flex items-center gap-4 bg-white text-neutral-900 px-10 py-5 rounded-full font-bold text-xl hover:shadow-glow-sage transition-all hover:scale-105"
          >
              Get Started Free
            <svg className="w-6 h-6 transition-transform group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 relative">
        {/* Top accent line */}
        <div className="h-1 bg-gradient-to-r from-sage-light via-sage-medium to-sage-dark" />
        
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 lg:gap-8">
            
            {/* Left - Contact */}
            <div className="text-center lg:text-left">
              <h3 className="text-sage-light font-medium tracking-[0.2em] uppercase text-sm mb-8">
                Contact
              </h3>
              <div className="w-8 h-px bg-sage-medium/50 mx-auto lg:mx-0 mb-8" />
              <div className="space-y-3 text-white/60">
                <p className="hover:text-white transition-colors cursor-pointer">hello@voicebridge.ai</p>
              </div>
              <div className="mt-8 text-white/40 text-sm leading-relaxed">
                <p>Empowering voices worldwide.</p>
                <p>Practice at your own pace.</p>
              </div>
            </div>

            {/* Center - Brand */}
            <div className="text-center">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gradient-to-br from-sage-medium to-sage-dark rounded-2xl flex items-center justify-center mb-6 shadow-glow-sage">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h3l3-6 4 12 3-6h5" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-9-9" opacity="0.5" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white tracking-wide mb-8">VOICEBRIDGE</h2>
                
                {/* Social Icons */}
                <div className="flex items-center justify-center gap-6 mb-8">
                  <a href="#" className="text-white/50 hover:text-sage-light transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-white/50 hover:text-sage-light transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-white/50 hover:text-sage-light transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-white/50 hover:text-sage-light transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                </div>
                
                <p className="text-white/30 text-sm">By VoiceBridge AI</p>
              </div>
            </div>

            {/* Right - Stay in Touch */}
            <div className="text-center lg:text-right">
              <h3 className="text-sage-light font-medium tracking-[0.2em] uppercase text-sm mb-8">
                Stay in Touch
              </h3>
              <div className="w-8 h-px bg-sage-medium/50 mx-auto lg:ml-auto lg:mr-0 mb-8" />
              <div className="max-w-xs mx-auto lg:ml-auto lg:mr-0">
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full px-4 py-3 border border-white/20 bg-white/5 text-white placeholder-white/40 text-center focus:outline-none focus:border-sage-medium transition-colors mb-4"
                />
                <button className="w-full px-4 py-3 border border-white/20 text-white/70 hover:bg-sage-medium hover:text-white hover:border-sage-medium tracking-[0.15em] uppercase text-sm transition-all">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
            <nav className="flex flex-wrap justify-center gap-8 lg:gap-12">
              <Link href="/therapy" className="text-white/50 hover:text-sage-light tracking-[0.15em] uppercase text-xs transition-colors">
                Therapy
              </Link>
              <Link href="/bridge" className="text-white/50 hover:text-sage-light tracking-[0.15em] uppercase text-xs transition-colors">
                Bridge
              </Link>
              <Link href="/guides" className="text-white/50 hover:text-sage-light tracking-[0.15em] uppercase text-xs transition-colors">
                Guides
              </Link>
              <Link href="/progress" className="text-white/50 hover:text-sage-light tracking-[0.15em] uppercase text-xs transition-colors">
                Progress
              </Link>
              <span className="text-white/50 hover:text-sage-light tracking-[0.15em] uppercase text-xs transition-colors cursor-pointer">
                About
              </span>
              <span className="text-white/50 hover:text-sage-light tracking-[0.15em] uppercase text-xs transition-colors cursor-pointer">
                Contact
              </span>
            </nav>
            <p className="text-center text-white/30 text-xs mt-8">
              © 2025 VoiceBridge AI. All rights reserved.
            </p>
          </div>
        </div>

        {/* Scroll to Top Button */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="absolute right-6 bottom-20 w-12 h-12 bg-sage-medium hover:bg-sage-light text-white hover:text-neutral-900 flex items-center justify-center transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </footer>
    </div>
  )
}
