// EEG Meditation Session Component
// Handles the full meditation session with EEG monitoring and music

import { useState, useEffect, useRef } from 'react'
import EEGVisualizer from './EEGVisualizer'
import { EEGService, type EEGDataPoint, type EEGSession } from '../utils/eegService'
import { callGeminiAPI } from '../utils/geminiAPI'

interface EEGMeditationSessionProps {
  duration: number // in minutes
  onComplete: (session: EEGSession, aiAnalysis: string) => void
  onCancel: () => void
}

type SessionState = 'preparing' | 'connecting' | 'ready' | 'active' | 'completing' | 'completed'

export default function EEGMeditationSession({ 
  duration, 
  onComplete, 
  onCancel 
}: EEGMeditationSessionProps) {
  const [state, setState] = useState<SessionState>('preparing')
  const [timeLeft, setTimeLeft] = useState(duration * 60) // seconds
  const [currentEEGData, setCurrentEEGData] = useState<EEGDataPoint | null>(null)
  const [session, setSession] = useState<EEGSession | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const eegService = EEGService.getInstance()

  // Keep pause state in a ref so EEG callbacks can read it without re-subscribing
  const isPausedRef = useRef(false)
  useEffect(() => {
    isPausedRef.current = isPaused
  }, [isPaused])

  // Throttle incoming EEG updates so React isn't overwhelmed by 200–300Hz streams
  const lastUpdateRef = useRef<number>(0)

  const tracks = [
    {
      id: 'om',
      name: 'OM Chanting',
      description: 'Traditional meditative chant',
      emoji: '🕉️',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    },
    {
      id: 'rain',
      name: 'Rain & Thunder',
      description: 'Soothing storm ambience',
      emoji: '🌧️',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    },
    {
      id: 'bowl',
      name: 'Singing Bowls',
      description: 'Deep Tibetan tones',
      emoji: '🔔',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    },
  ] as const

  const [currentTrackId, setCurrentTrackId] = useState<(typeof tracks)[number]['id']>('om')
  
  // Check if running on localhost
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

  useEffect(() => {
    // Initialize connection when component mounts
    if (state === 'preparing') {
      handleConnect()
    }

    return () => {
      // Cleanup on unmount
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      eegService.disconnect()
    }
  }, [])

  useEffect(() => {
    // Timer countdown
    let interval: NodeJS.Timeout | null = null

    if (state === 'active' && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSessionComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [state, timeLeft, isPaused])

  const handleConnect = async () => {
    setState('connecting')
    
    if (!isLocalhost) {
      // Show message that EEG only works on localhost
      alert('EEG connection is only available when running on localhost. Please run the app locally to use this feature.')
      setState('preparing')
      return
    }

    const connected = await eegService.connect('websocket') // Change to 'bluetooth' or 'api' as needed
    
    if (connected) {
      // Set up data callback
      eegService.onDataUpdate((data: EEGDataPoint) => {
        if (isPausedRef.current) return

        const now = Date.now()
        const last = lastUpdateRef.current
        // Limit UI updates to ~20 FPS
        if (now - last < 50) return
        lastUpdateRef.current = now

        setCurrentEEGData(data)
      })
      
      setState('ready')
    } else {
      alert('Failed to connect to EEG device. Please check your connection and try again.')
      setState('preparing')
    }
  }

  const handleStartSession = () => {
    const newSession = eegService.startSession()
    setSession(newSession)
    setState('active')
    setTimeLeft(duration * 60)
    setIsPaused(false)
    
    // Start playing meditation music
    playMeditationMusic(currentTrackId)
  }

  const playMeditationMusic = (trackId: (typeof tracks)[number]['id']) => {
    const track = tracks.find(t => t.id === trackId) ?? tracks[0]

    // Reuse existing audio element if possible
    if (!audioRef.current) {
      audioRef.current = new Audio(track.url)
      audioRef.current.loop = true
      audioRef.current.volume = 0.5
    } else {
      audioRef.current.src = track.url
    }

    audioRef.current
      .play()
      .then(() => {
        setCurrentTrackId(trackId)
      })
      .catch(error => {
        console.error('Error playing audio:', error)
        // Continue without audio if playback fails
      })
  }

  const handlePauseToggle = () => {
    if (state !== 'active') return

    if (!isPaused) {
      // Pause timer + music + data recording
      setIsPaused(true)
      if (audioRef.current) {
        audioRef.current.pause()
      }
      if (session) {
        session.isActive = false
      }
    } else {
      // Resume timer + music + data recording
      setIsPaused(false)
      if (audioRef.current) {
        audioRef.current
          .play()
          .catch(err => console.error('Error resuming audio:', err))
      }
      if (session) {
        session.isActive = true
      }
    }
  }

  const handleTrackChange = (trackId: (typeof tracks)[number]['id']) => {
    setCurrentTrackId(trackId)
    if (state === 'active') {
      playMeditationMusic(trackId)
    }
  }

  const handleSessionComplete = async () => {
    setState('completing')
    
    // Stop music
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    // Stop EEG session
    const completedSession = eegService.stopSession()
    if (completedSession) {
      setSession(completedSession)
    }

    // Generate AI analysis
    setIsLoadingAnalysis(true)
    const analysis = await generateAIAnalysis(completedSession)
    setAiAnalysis(analysis)
    setIsLoadingAnalysis(false)
    
    setState('completed')
    
    // Call onComplete after a brief delay
    setTimeout(() => {
      if (completedSession && analysis) {
        onComplete(completedSession, analysis)
      }
    }, 2000)
  }

  const generateAIAnalysis = async (session: EEGSession | null): Promise<string> => {
    if (!session || session.dataPoints.length === 0) {
      return "No EEG data was recorded during this session. Please ensure your device is properly connected."
    }

    // Calculate average values
    const avgAlpha = session.dataPoints.reduce((sum, p) => sum + p.alpha, 0) / session.dataPoints.length
    const avgBeta = session.dataPoints.reduce((sum, p) => sum + p.beta, 0) / session.dataPoints.length
    const avgTheta = session.dataPoints.reduce((sum, p) => sum + p.theta, 0) / session.dataPoints.length
    const avgDelta = session.dataPoints.reduce((sum, p) => sum + p.delta, 0) / session.dataPoints.length
    const avgGamma = session.dataPoints.reduce((sum, p) => sum + p.gamma, 0) / session.dataPoints.length

    // Calculate metrics
    const focus = Math.min(100, Math.max(0, (avgBeta / (avgAlpha + avgTheta + 1)) * 50))
    const stress = Math.min(100, Math.max(0, (avgBeta / (avgAlpha + 1)) * 30))
    const relaxation = Math.min(100, Math.max(0, (avgAlpha / (avgBeta + 1)) * 40))
    const sleepQuality = Math.min(100, Math.max(0, (avgTheta / (avgBeta + 1)) * 60))

    // Create prompt for AI analysis
    const prompt = `Analyze this EEG meditation session data and provide a concise, structured summary.

Session Duration: ${Math.floor(session.duration / 60)} minutes
Data Points Recorded: ${session.dataPoints.length}

Average Brain Wave Levels:
- Alpha (8-13 Hz): ${avgAlpha.toFixed(2)}μV - Associated with relaxed awareness and meditation
- Beta (13-30 Hz): ${avgBeta.toFixed(2)}μV - Associated with active concentration and alertness
- Theta (4-8 Hz): ${avgTheta.toFixed(2)}μV - Associated with deep relaxation and creativity
- Delta (0.5-4 Hz): ${avgDelta.toFixed(2)}μV - Associated with deep sleep
- Gamma (30-100 Hz): ${avgGamma.toFixed(2)}μV - Associated with high-level processing

Calculated Metrics:
- Focus Level: ${focus.toFixed(0)}%
- Stress Level: ${stress.toFixed(0)}%
- Relaxation Level: ${relaxation.toFixed(0)}%
- Sleep Quality Indicator: ${sleepQuality.toFixed(0)}%

Please provide your response in this exact format, keeping it short and easy to scan:

1. Session Snapshot (2–3 short sentences)
2. Brain State Highlights (3–5 bullet points, max 12 words each)
3. Recommendations (3–5 bullet points, max 12 words each)

Hard limits:
- Max 220 words total
- No long paragraphs, keep it punchy and visual
- Warm, encouraging, mindfulness-focused tone`

    try {
      const response = await callGeminiAPI(prompt)
      if (response.success && response.text) {
        return response.text
      } else {
        return getFallbackAnalysis(session, focus, stress, relaxation, sleepQuality)
      }
    } catch (error) {
      console.error('Error generating AI analysis:', error)
      return getFallbackAnalysis(session, focus, stress, relaxation, sleepQuality)
    }
  }

  const getFallbackAnalysis = (
    session: EEGSession,
    focus: number,
    stress: number,
    relaxation: number,
    sleepQuality: number
  ): string => {
    return `Your ${Math.floor(session.duration / 60)}-minute meditation session has been completed!

**Session Summary:**
- Duration: ${Math.floor(session.duration / 60)} minutes
- Data Points Recorded: ${session.dataPoints.length}

**Your Brain State:**
- Focus Level: ${focus.toFixed(0)}% - ${focus >= 70 ? 'Excellent focus!' : focus >= 50 ? 'Good focus' : 'Room for improvement'}
- Stress Level: ${stress.toFixed(0)}% - ${stress <= 30 ? 'Very low stress - great!' : stress <= 60 ? 'Moderate stress' : 'Consider more relaxation techniques'}
- Relaxation Level: ${relaxation.toFixed(0)}% - ${relaxation >= 70 ? 'Deeply relaxed!' : 'Could be more relaxed'}
- Sleep Quality Indicator: ${sleepQuality.toFixed(0)}% - ${sleepQuality >= 70 ? 'Healthy patterns' : 'Consider improving sleep hygiene'}

**Recommendations:**
${focus < 50 ? '- Try focus meditation exercises to improve concentration\n' : ''}${stress > 60 ? '- Practice deep breathing techniques to reduce stress\n' : ''}${relaxation < 60 ? '- Extend your meditation sessions for deeper relaxation\n' : ''}- Continue regular practice to see long-term benefits
- Track your progress over time to observe improvements

Keep up the great work on your mindfulness journey! 🧘‍♀️✨`
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Preparing state
  if (state === 'preparing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-purple-600 font-medium">Preparing session...</p>
        </div>
      </div>
    )
  }

  // Connecting state
  if (state === 'connecting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connecting to EEG Device</h2>
          <p className="text-gray-600 mb-4">
            {!isLocalhost 
              ? 'EEG connection is only available on localhost. Please run the app locally.'
              : 'Please ensure your EEG device is powered on and connected.'}
          </p>
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // Ready state - Instructions before starting
  if (state === 'ready') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 p-6">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Ready to Begin</h2>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Instructions:</h3>
            <ol className="space-y-3 text-sm text-gray-700">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-semibold">1</span>
                <span>Place your EEG headband comfortably on your head</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-semibold">2</span>
                <span>Find a quiet, comfortable place to meditate</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-semibold">3</span>
                <span>Close your eyes and focus on your breath</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-semibold">4</span>
                <span>Meditation music will play automatically</span>
              </li>
            </ol>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleStartSession}
              className="flex-1 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              Start {duration}-Minute Session
            </button>
            <button
              onClick={onCancel}
              className="px-6 py-4 bg-white/80 backdrop-blur-sm text-gray-700 font-medium rounded-2xl border border-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Active session state
  if (state === 'active') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 p-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onCancel}
            className="p-2 rounded-full bg-white/80 backdrop-blur-sm"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-xl font-semibold text-gray-900">Meditation Session</h2>
          <div className="w-10"></div>
        </div>

        {/* Timer + controls */}
        <div className="mb-6">
          <div className="text-center mb-4">
            <div className="text-6xl font-bold text-gray-900 mb-2">{formatTime(timeLeft)}</div>
            <p className="text-gray-600">{isPaused ? 'Session paused' : 'Time remaining'}</p>
          </div>

          <div className="flex items-center justify-center gap-3 mb-4">
            <button
              onClick={handlePauseToggle}
              className="px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-800 font-medium flex items-center gap-2 shadow-sm"
            >
              {isPaused ? (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                  Resume
                </>
              ) : (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                  Pause
                </>
              )}
            </button>
          </div>

          {/* Music selection */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 p-4">
            <p className="text-sm font-medium text-gray-800 mb-3">Meditation music</p>
            <div className="flex flex-wrap gap-2">
              {tracks.map(track => {
                const isSelected = track.id === currentTrackId
                return (
                  <button
                    key={track.id}
                    onClick={() => handleTrackChange(track.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm'
                        : 'bg-gray-50 text-gray-700 border border-gray-200'
                    }`}
                  >
                    <span>{track.emoji}</span>
                    <span>{track.name}</span>
                  </button>
                )
              })}
              <button
                onClick={() => {
                  setCurrentTrackId('om')
                  if (audioRef.current) {
                    audioRef.current.pause()
                  }
                }}
                className="px-3 py-2 rounded-xl text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200"
              >
                Silence
              </button>
            </div>
          </div>
        </div>

        {/* EEG Visualizer */}
        <div className="mb-6">
          <EEGVisualizer data={currentEEGData} isActive={!isPaused} />
        </div>

        {/* Meditation guidance */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 p-6 text-center">
          <p className="text-gray-700 mb-2">Focus on your breath</p>
          <div className="flex justify-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse delay-75"></div>
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse delay-150"></div>
          </div>
        </div>
      </div>
    )
  }

  // Completing/Completed state
  if (state === 'completing' || state === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          {isLoadingAnalysis ? (
            <>
              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Analyzing Your Session</h2>
              <p className="text-gray-600">AI is generating personalized insights...</p>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">✨</div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Session Complete!</h2>
              <p className="text-gray-600 mb-6">Your meditation session has been analyzed</p>
              <button
                onClick={() => {
                  if (session && aiAnalysis) {
                    onComplete(session, aiAnalysis)
                  }
                }}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                View Analysis Report
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return null
}

