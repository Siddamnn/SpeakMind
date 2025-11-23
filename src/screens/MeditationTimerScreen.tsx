import { useState, useEffect } from 'react'
import type { Screen } from '../App'
import { useTheme } from '../contexts/ThemeContext'

interface MeditationTimerScreenProps {
  onNavigate: (screen: Screen) => void
}

export default function MeditationTimerScreen({ onNavigate }: MeditationTimerScreenProps) {
  const { colors, isDark } = useTheme()
  const [selectedTime, setSelectedTime] = useState(10) // minutes
  const [isActive, setIsActive] = useState(false)
  const [timeLeft, setTimeLeft] = useState(selectedTime * 60) // seconds
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    setTimeLeft(selectedTime * 60)
  }, [selectedTime])

  useEffect(() => {
    let interval: number

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            setIsActive(false)
            setIsCompleted(true)
            return 0
          }
          return time - 1
        })
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isActive, timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStart = () => {
    setIsActive(true)
    setIsCompleted(false)
  }

  const handlePause = () => {
    setIsActive(false)
  }

  const handleReset = () => {
    setIsActive(false)
    setTimeLeft(selectedTime * 60)
    setIsCompleted(false)
  }

  const progress = ((selectedTime * 60 - timeLeft) / (selectedTime * 60)) * 100

  const timeOptions = [5, 10, 15, 20, 25, 30, 45, 60]

  if (isCompleted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-white" style={{
        background: `linear-gradient(135deg, ${colors.gradientFrom} 0%, ${colors.gradientTo} 100%)`
      }}>
        <div className="text-center">
          <div className="text-8xl mb-6">✨</div>
          <h1 className="text-3xl font-bold mb-4">Well Done!</h1>
          <p className="text-xl text-white/90 mb-8">
            You've completed your {selectedTime}-minute meditation session
          </p>
          
          <div className="space-y-4">
            <button
              onClick={() => onNavigate('home')}
              className="w-full bg-white font-semibold py-4 px-8 rounded-4xl transition-all duration-300 active:scale-95"
              style={{ color: colors.primary }}
            >
              Back to Home
            </button>
            
            <button
              onClick={handleReset}
              className="w-full bg-white/20 backdrop-blur-sm text-white font-semibold py-4 px-8 rounded-4xl border-2 border-white/30 transition-all duration-300 active:scale-95"
            >
              Meditate Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col px-6 text-white" style={{
      background: `linear-gradient(135deg, ${colors.gradientFrom} 0%, ${colors.gradientTo} 100%)`
    }}>
      {/* Header */}
      <div className="flex items-center justify-between pt-12 pb-8">
        <button 
          onClick={() => onNavigate('home')}
          className="text-2xl"
        >
          ←
        </button>
        <h1 className="text-xl font-semibold">Meditation Timer</h1>
        <div className="w-8"></div>
      </div>

      {/* Meditation Illustration */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative mb-12">
          <div className="text-8xl mb-8">🧘‍♀️</div>
          
          {/* Progress Ring */}
          <div className="absolute -inset-8">
            <svg className="w-32 h-32 progress-ring" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="4"
              />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress / 100)}`}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
          </div>
        </div>

        {/* Timer Display */}
        <div className="meditation-timer text-white mb-8">
          {formatTime(timeLeft)}
        </div>

        {/* Time Selector (when not active) */}
        {!isActive && timeLeft === selectedTime * 60 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-center">Select Duration</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {timeOptions.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedTime === time
                      ? 'bg-white border border-white/30'
                      : 'bg-white/20 text-white border border-white/30'
                  }`}
                  style={selectedTime === time ? { color: colors.primary } : undefined}
                >
                  {time}m
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex space-x-4">
          {!isActive ? (
            <button
              onClick={handleStart}
              className="bg-white font-semibold py-4 px-8 rounded-4xl shadow-button transition-all duration-300 active:scale-95"
              style={{ color: colors.primary }}
            >
              {timeLeft === selectedTime * 60 ? "Let's Go" : 'Resume'}
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="bg-white/20 backdrop-blur-sm text-white font-semibold py-4 px-8 rounded-4xl border-2 border-white/30 transition-all duration-300 active:scale-95"
            >
              Pause
            </button>
          )}
          
          {timeLeft !== selectedTime * 60 && (
            <button
              onClick={handleReset}
              className="bg-white/10 backdrop-blur-sm text-white font-semibold py-4 px-8 rounded-4xl border border-white/30 transition-all duration-300 active:scale-95"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Bottom breathing guide */}
      {isActive && (
        <div className="pb-8 text-center">
          <p className="text-white/80 text-sm mb-2">Focus on your breath</p>
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse delay-75"></div>
            <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse delay-150"></div>
          </div>
        </div>
      )}
    </div>
  )
}