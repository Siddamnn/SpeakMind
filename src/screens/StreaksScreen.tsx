import type { Screen } from '../App'
import { IoChevronBack } from 'react-icons/io5'
import { useEffect, useMemo, useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'

interface StreaksScreenProps {
  onNavigate: (screen: Screen) => void
  user?: {
    name: string
    streak: number
    level: number
    timemeditated: number
    meditations: number
    points: number
  }
}

export default function StreaksScreen({ onNavigate }: StreaksScreenProps) {
  const { colors, isDark } = useTheme()
  // Local state from localStorage
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear())
  const [meditatedDates, setMeditatedDates] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('speakmind_meditation_dates')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const [shields, setShields] = useState<number>(() => {
    const raw = localStorage.getItem('speakmind_shields')
    return raw ? Number(raw) || 0 : 0
  })

  const today = useMemo(() => new Date(), [])
  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []) // YYYY-MM-DD
  const dateSet = useMemo(() => new Set<string>(meditatedDates), [meditatedDates])

  const save = (dates: string[], shieldsVal: number) => {
    localStorage.setItem('speakmind_meditation_dates', JSON.stringify(dates))
    localStorage.setItem('speakmind_shields', String(shieldsVal))
  }

  const markTodayMeditated = () => {
    if (dateSet.has(todayKey)) return
    const updated = Array.from(new Set([...meditatedDates, todayKey])).sort()
    setMeditatedDates(updated)
    save(updated, shields)
  }

  const computeStreak = (): number => {
    let streak = 0
    const d = new Date()
    while (true) {
      const key = d.toISOString().slice(0, 10)
      if (dateSet.has(key)) {
        streak += 1
        d.setDate(d.getDate() - 1)
      } else {
        break
      }
    }
    return streak
  }

  const currentDate = new Date(selectedYear, selectedMonth, 1)
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }
  
  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay()
  }
  
  const daysInMonth = getDaysInMonth(currentMonth, currentYear)
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear)

  const monthLabel = new Date(currentYear, currentMonth, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' })
  const streak = computeStreak()
  const totalDaysMeditated = meditatedDates.length

  const renderCalendar = () => {
    const days = []
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8"></div>)
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = new Date(currentYear, currentMonth, day).toISOString().slice(0, 10)
      const hasMeditation = dateSet.has(dateKey)
      const isToday = dateKey === todayKey
      
      days.push(
        <div
          key={day}
          className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
            isToday 
              ? 'text-white' 
              : hasMeditation 
                ? isDark 
                  ? 'bg-purple-900/40 text-purple-300 border border-purple-700/50' 
                  : 'bg-purple-100 text-purple-700 border border-purple-200'
                : 'text-gray-400 dark:text-gray-600'
          }`}
          style={isToday ? {
            background: `linear-gradient(135deg, ${colors.gradientFrom} 0%, ${colors.gradientTo} 100%)`
          } : undefined}
        >
          {day}
        </div>
      )
    }
    
    return days
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-dark-bg dark:via-dark-bg-secondary dark:to-dark-bg relative pb-20 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={() => onNavigate('home')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-dark-card-hover rounded-full transition-colors"
        >
          <IoChevronBack className="w-6 h-6 text-gray-700 dark:text-dark-text" />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-dark-text">{streak} Day Streak</h1>
          <p className="text-sm text-gray-500 dark:text-dark-text-secondary">Keep building your momentum</p>
        </div>
        <div className="w-10"></div>
      </div>

      <div className="px-4 space-y-6">
        {/* Miracle Moment card */}
        <div 
          className="rounded-2xl p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          style={{
            background: `linear-gradient(135deg, ${colors.gradientFrom} 0%, ${colors.gradientTo} 100%)`
          }}
          onClick={() => onNavigate('meditation')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <span className="text-white text-2xl">⭐</span>
            </div>
            <div className="flex-1">
              <div className="text-xl font-bold text-white mb-1">Miracle Moment</div>
              <div className="text-white/90 text-sm">2 days until your next milestone</div>
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-gray-100 dark:border-dark-border shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className={`w-12 h-12 ${isDark ? 'bg-yellow-900/30' : 'bg-yellow-100'} rounded-2xl flex items-center justify-center mb-3`}>
                <span className={`${isDark ? 'text-yellow-300' : 'text-yellow-600'} text-xl`}>📅</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-dark-text-secondary mb-1">Days Meditated</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-dark-text">{totalDaysMeditated}</div>
            </div>
          </div>
          <div className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-gray-100 dark:border-dark-border shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className={`w-12 h-12 ${isDark ? 'bg-pink-900/30' : 'bg-pink-100'} rounded-2xl flex items-center justify-center mb-3`}>
                <span className={`${isDark ? 'text-pink-300' : 'text-pink-600'} text-xl`}>🛡️</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-dark-text-secondary mb-1">Shields Used</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-dark-text">{shields}</div>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white dark:bg-dark-card rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-dark-border">
          <div className="flex items-center justify-between mb-4">
            <button className="text-gray-400 dark:text-dark-text-secondary" onClick={() => {
              const prev = new Date(currentYear, currentMonth - 1, 1)
              setSelectedMonth(prev.getMonth())
              setSelectedYear(prev.getFullYear())
            }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className="font-medium text-gray-900 dark:text-dark-text">{monthLabel}</h3>
            <button className="text-gray-400 dark:text-dark-text-secondary" onClick={() => {
              const next = new Date(currentYear, currentMonth + 1, 1)
              setSelectedMonth(next.getMonth())
              setSelectedYear(next.getFullYear())
            }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-sm text-gray-500 dark:text-dark-text-secondary mb-3">
            {['S','M','T','W','T','F','S'].map((day, index) => (
              <div key={index} className="py-2 font-medium">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={markTodayMeditated}
            disabled={dateSet.has(todayKey)}
            className={`flex-1 py-3 rounded-2xl font-medium text-sm transition-all ${
              dateSet.has(todayKey) 
                ? 'bg-gray-300 dark:bg-gray-700 text-white cursor-not-allowed' 
                : 'text-white shadow-lg hover:shadow-xl'
            }`}
            style={!dateSet.has(todayKey) ? {
              background: `linear-gradient(135deg, ${colors.gradientFrom} 0%, ${colors.gradientTo} 100%)`
            } : undefined}
          >
            {dateSet.has(todayKey) ? 'Today Logged' : 'Mark Today as Meditated'}
          </button>
          <button
            onClick={() => {
              const useShield = !dateSet.has(todayKey) && shields > 0
              if (useShield) {
                const newShields = shields - 1
                setShields(newShields)
                save(meditatedDates, newShields)
                alert('Shield used to protect your streak today!')
              } else {
                const newShields = shields + 1
                setShields(newShields)
                save(meditatedDates, newShields)
                alert('You earned a shield! Use it on a tough day to protect your streak.')
              }
            }}
            className="px-4 py-3 bg-white dark:bg-dark-card border border-purple-200 dark:border-purple-700/50 text-purple-700 dark:text-purple-300 rounded-2xl font-medium text-sm hover:bg-gray-50 dark:hover:bg-dark-card-hover transition-colors"
          >
            {shields > 0 ? `Shields: ${shields}` : 'Get Shield'}
          </button>
        </div>
      </div>
    </div>
  )
}
