import type { Screen } from '../App'
import { useTheme } from '../contexts/ThemeContext'

interface AICoachScreenProps {
  onNavigate: (screen: Screen) => void
}

export default function AICoachScreen({ onNavigate }: AICoachScreenProps) {
  const { colors, isDark } = useTheme()
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-dark-bg dark:via-dark-bg-secondary dark:to-dark-bg pb-20 transition-colors duration-300">
      {/* Header */}
      <div className="px-6 pt-12 pb-8 rounded-b-5xl" style={{
        background: `linear-gradient(135deg, ${colors.gradientFrom} 0%, ${colors.gradientTo} 100%)`
      }}>
        <div className="flex items-center space-x-4 text-white">
          <button 
            onClick={() => onNavigate('home')}
            className="text-2xl"
          >
            ←
          </button>
          <h1 className="text-2xl font-bold">Midnight & Relaxation</h1>
        </div>
      </div>

      <div className="px-6 -mt-4">
        {/* Media Player */}
        <div className="bg-white/90 dark:bg-dark-card/90 backdrop-blur-sm rounded-2xl p-5 border border-gray-200 dark:border-dark-border shadow-lg mb-6">
          <div className="text-center">
            <div className="text-8xl mb-6">🌙</div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-dark-text mb-2">Midnight & Relaxation</h2>
            <p className="text-gray-600 dark:text-dark-text-secondary mb-6">A calming session to help you unwind</p>
            
            {/* Progress Bar */}
            <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
              <div className="rounded-full h-2 w-1/3" style={{ background: colors.primary }}></div>
            </div>
            
            <div className="flex justify-between text-sm text-gray-500 dark:text-dark-text-secondary mb-6">
              <span>3:45</span>
              <span>15:00</span>
            </div>
            
            {/* Player Controls */}
            <div className="flex items-center justify-center space-x-6">
              <button className="text-3xl" style={{ color: colors.primary }}>⏮️</button>
              <button className="text-5xl" style={{ color: colors.primary }}>⏸️</button>
              <button className="text-3xl" style={{ color: colors.primary }}>⏭️</button>
            </div>
          </div>
        </div>

        {/* Session Info */}
        <div className="bg-white/90 dark:bg-dark-card/90 backdrop-blur-sm rounded-2xl p-5 border border-gray-200 dark:border-dark-border shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-dark-text">About this session</h3>
          <p className="text-gray-600 dark:text-dark-text-secondary text-sm leading-relaxed">
            This relaxing meditation is designed to help you unwind and prepare for a peaceful night's sleep. 
            Focus on releasing the tension from your day and allowing your mind to settle into tranquility.
          </p>
        </div>
      </div>
    </div>
  )
}