import { useState } from 'react'
import type { Screen } from '../App'
import { IoChevronBack } from 'react-icons/io5'
import { useTheme } from '../contexts/ThemeContext'

interface JournalScreenProps {
  onNavigate: (screen: Screen) => void
  user: {
    name: string
    streak: number
    level: number
    timemeditated: number
    meditations: number
    points: number
  }
}

export default function JournalScreen({ onNavigate, user: _user }: JournalScreenProps) {
  const { colors, isDark } = useTheme()
  const [currentEntry, setCurrentEntry] = useState('')
  const [selectedMood, setSelectedMood] = useState<string | null>(null)

  const moods = [
    { emoji: '😊', label: 'Happy', color: isDark ? 'bg-orange-900/30' : 'bg-orange-100' },
    { emoji: '😌', label: 'Calm', color: isDark ? 'bg-yellow-900/30' : 'bg-yellow-100' },
    { emoji: '😐', label: 'Neutral', color: isDark ? 'bg-gray-800/30' : 'bg-gray-100' },
    { emoji: '😕', label: 'Unsure', color: isDark ? 'bg-blue-900/30' : 'bg-blue-100' },
    { emoji: '😞', label: 'Down', color: isDark ? 'bg-purple-900/30' : 'bg-purple-100' },
  ]

  const handleSaveReflection = () => {
    if (currentEntry.trim()) {
      // Handle save logic here
      console.log('Saving reflection:', currentEntry, 'Mood:', selectedMood)
      // You could navigate back or show success message
      onNavigate('home')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-dark-bg dark:via-dark-bg-secondary dark:to-dark-bg pb-20 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-3 md:p-4">
        <button
          onClick={() => onNavigate('meditation')}
          className="p-1.5 md:p-2 hover:bg-gray-100 dark:hover:bg-dark-card-hover rounded-full transition-colors"
        >
          <IoChevronBack className="w-5 h-5 md:w-6 md:h-6 text-gray-700 dark:text-dark-text" />
        </button>
        <div className="text-center">
          <h1 className="text-base md:text-lg font-semibold text-gray-900 dark:text-dark-text">Reflection Journal</h1>
          <p className="text-xs md:text-sm text-gray-500 dark:text-dark-text-secondary">Write one thought to clear your mind</p>
        </div>
        <div className="w-8 md:w-10"></div>
      </div>

      <div className="px-4 md:px-8 lg:px-12">
        <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
        {/* Mood Selector */}
        <div>
          <h3 className="text-base md:text-lg font-medium text-gray-900 dark:text-dark-text mb-3 md:mb-4">Today I feel</h3>
          <div className="flex justify-between gap-1.5 md:gap-2">
            {moods.map((mood) => (
              <button
                key={mood.label}
                onClick={() => setSelectedMood(mood.label)}
                className={`flex flex-col items-center space-y-1 md:space-y-2 ${
                  selectedMood === mood.label ? 'opacity-100' : 'opacity-70'
                }`}
              >
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full ${mood.color} flex items-center justify-center text-xl md:text-2xl border-2 ${
                  selectedMood === mood.label ? 'border-purple-400 dark:border-purple-500' : 'border-transparent'
                }`}>
                  {mood.emoji}
                </div>
                <span className="text-[10px] md:text-xs font-medium text-gray-700 dark:text-dark-text-secondary">{mood.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Journal Input */}
        <div>
          <h3 className="text-base md:text-lg font-medium text-gray-900 dark:text-dark-text mb-3 md:mb-4">Write your mind today ?</h3>
          <textarea
            value={currentEntry}
            onChange={(e) => setCurrentEntry(e.target.value)}
            placeholder="Today I feel..."
            className="w-full h-48 md:h-64 p-3 md:p-4 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl md:rounded-2xl text-sm md:text-base text-gray-900 dark:text-dark-text placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 resize-none"
            style={{ 
              '--tw-ring-color': colors.primary 
            } as React.CSSProperties & { '--tw-ring-color': string }}
          />
        </div>

        {/* Save Button */}
        <div className="pt-4 md:pt-8">
          <button
            onClick={handleSaveReflection}
            className="w-full text-white font-semibold py-3 md:py-4 rounded-xl md:rounded-2xl transition-all text-sm md:text-base shadow-lg hover:shadow-xl"
            style={{
              background: `linear-gradient(135deg, ${colors.gradientFrom} 0%, ${colors.gradientTo} 100%)`
            }}
          >
            Save Reflection
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}
