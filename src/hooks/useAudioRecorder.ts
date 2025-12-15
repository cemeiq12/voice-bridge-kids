'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface UseAudioRecorderOptions {
  onDataAvailable?: (blob: Blob) => void
  onStop?: (blob: Blob) => void
  onError?: (error: Error) => void
}

interface UseAudioRecorderReturn {
  isRecording: boolean
  isPaused: boolean
  audioLevel: number
  duration: number
  start: () => Promise<void>
  stop: () => void
  pause: () => void
  resume: () => void
}

export function useAudioRecorder(
  options: UseAudioRecorderOptions = {}
): UseAudioRecorderReturn {
  const { onDataAvailable, onStop, onError } = options

  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [duration, setDuration] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  const updateAudioLevel = useCallback(() => {
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
      analyserRef.current.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length
      setAudioLevel(average / 255)
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel)
    }
  }, [])

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

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
          onDataAvailable?.(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        onStop?.(blob)

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorderRef.current.onerror = (event) => {
        onError?.(new Error('MediaRecorder error'))
      }

      // Start recording
      mediaRecorderRef.current.start(100) // Collect data every 100ms
      setIsRecording(true)
      setIsPaused(false)

      // Start audio level monitoring
      updateAudioLevel()

      // Start duration tracking
      startTimeRef.current = Date.now()
      durationIntervalRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
    } catch (error) {
      onError?.(error as Error)
      console.error('Error starting recording:', error)
    }
  }, [onDataAvailable, onStop, onError, updateAudioLevel])

  const stop = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
    }

    setIsRecording(false)
    setIsPaused(false)
    setAudioLevel(0)
    setDuration(0)
  }, [])

  const pause = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause()
      setIsPaused(true)

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  const resume = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      updateAudioLevel()
    }
  }, [updateAudioLevel])

  return {
    isRecording,
    isPaused,
    audioLevel,
    duration,
    start,
    stop,
    pause,
    resume,
  }
}
