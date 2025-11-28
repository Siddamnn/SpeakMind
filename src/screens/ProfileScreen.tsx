import { useAuth } from '../contexts/AuthContext'
import type { Screen } from '../App'
import { useState, lazy, Suspense } from 'react'
const SettingsModal = lazy(() => import('../components/SettingsModal'))
import LanguageWrapper from '../components/LanguageWrapper'
import ThemeToggle from '../components/ThemeToggle'

interface ProfileScreenProps {
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

interface BrainHealthMetrics {
  focus: number
  stress: number
  relaxation: number
  sleepQuality: number
  overall: number
  lastReading: string
}

interface BrainHealthTrend {
  date: string
  focus: number
  stress: number
  relaxation: number
  sleepQuality: number
}

interface MonthlyProgress {
  month: string
  totalMinutes: number
  sessions: number
  averageMood: number
  streakDays: number
}

interface MeditationSession {
  id: string
  date: string
  duration: number
  type: string
  mood: string
  satisfaction: number
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  category: 'streak' | 'meditation' | 'brain' | 'social'
  unlocked: boolean
  progress: number
  maxProgress: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  unlockedAt?: string
}

interface ProgressMilestone {
  id: string
  title: string
  description: string
  target: number
  current: number
  unit: string
  category: string
}

export default function ProfileScreen({ user, onNavigate }: ProfileScreenProps) {
  const { currentUser, logout } = useAuth()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'achievements'>('overview')

  // Mock brain health data
  const [brainHealthMetrics] = useState<BrainHealthMetrics>({
    focus: 78,
    stress: 22,
    relaxation: 85,
    sleepQuality: 72,
    overall: 79,
    lastReading: '2 hours ago'
  })

  const [brainHealthTrends] = useState<BrainHealthTrend[]>([
    { date: 'Mon', focus: 75, stress: 25, relaxation: 80, sleepQuality: 70 },
    { date: 'Tue', focus: 82, stress: 18, relaxation: 88, sleepQuality: 75 },
    { date: 'Wed', focus: 78, stress: 22, relaxation: 85, sleepQuality: 72 },
    { date: 'Thu', focus: 85, stress: 15, relaxation: 90, sleepQuality: 80 },
    { date: 'Fri', focus: 80, stress: 20, relaxation: 87, sleepQuality: 78 },
    { date: 'Sat', focus: 88, stress: 12, relaxation: 92, sleepQuality: 85 },
    { date: 'Sun', focus: 78, stress: 22, relaxation: 85, sleepQuality: 72 }
  ])

  // Mock meditation session data
  const [recentSessions] = useState<MeditationSession[]>([
    { id: '1', date: '2024-01-15', duration: 20, type: 'Mindfulness', mood: 'Calm', satisfaction: 9 },
    { id: '2', date: '2024-01-14', duration: 15, type: 'Breathing', mood: 'Focused', satisfaction: 8 },
    { id: '3', date: '2024-01-13', duration: 25, type: 'Body Scan', mood: 'Relaxed', satisfaction: 9 },
    { id: '4', date: '2024-01-12', duration: 10, type: 'Quick Calm', mood: 'Anxious', satisfaction: 6 },
    { id: '5', date: '2024-01-11', duration: 30, type: 'Loving Kindness', mood: 'Peaceful', satisfaction: 10 }
  ])

  // Mock monthly progress data
  const [monthlyProgress] = useState<MonthlyProgress[]>([
    { month: 'Oct', totalMinutes: 180, sessions: 12, averageMood: 7.5, streakDays: 8 },
    { month: 'Nov', totalMinutes: 240, sessions: 16, averageMood: 8.2, streakDays: 12 },
    { month: 'Dec', totalMinutes: 320, sessions: 20, averageMood: 8.8, streakDays: 15 },
    { month: 'Jan', totalMinutes: 280, sessions: 18, averageMood: 8.5, streakDays: 14 }
  ])

  // Mock achievements data
  const [achievements] = useState<Achievement[]>([
    { id: '1', title: 'First Steps', description: 'Complete your first meditation session', icon: '🌱', category: 'meditation', unlocked: true, progress: 1, maxProgress: 1, rarity: 'common', unlockedAt: '2024-01-01' },
    { id: '2', title: 'Week Warrior', description: 'Meditate for 7 consecutive days', icon: '🔥', category: 'streak', unlocked: true, progress: 7, maxProgress: 7, rarity: 'common', unlockedAt: '2024-01-07' },
    { id: '3', title: 'Mind Master', description: 'Achieve 80% focus score for 5 days', icon: '🧠', category: 'brain', unlocked: true, progress: 5, maxProgress: 5, rarity: 'rare', unlockedAt: '2024-01-10' },
    { id: '4', title: 'Zen Master', description: 'Complete 100 meditation sessions', icon: '🧘‍♀️', category: 'meditation', unlocked: false, progress: 18, maxProgress: 100, rarity: 'epic' },
    { id: '5', title: 'Social Butterfly', description: 'Connect with 10 friends', icon: '👥', category: 'social', unlocked: false, progress: 3, maxProgress: 10, rarity: 'rare' },
    { id: '6', title: 'Brain Optimizer', description: 'Maintain 90% brain health for 30 days', icon: '⚡', category: 'brain', unlocked: false, progress: 12, maxProgress: 30, rarity: 'legendary' }
  ])

  // Mock progress milestones
  const [milestones] = useState<ProgressMilestone[]>([
    { id: '1', title: 'Meditation Minutes', description: 'Total time meditated', target: 1000, current: 280, unit: 'minutes', category: 'meditation' },
    { id: '2', title: 'Perfect Sessions', description: 'Sessions rated 10/10', target: 50, current: 12, unit: 'sessions', category: 'quality' },
    { id: '3', title: 'Focus Mastery', description: 'Days with 90%+ focus', target: 30, current: 8, unit: 'days', category: 'brain' },
    { id: '4', title: 'Community Helper', description: 'Help others in community', target: 25, current: 5, unit: 'helps', category: 'social' }
  ])

  // Get stored user data
  const getUserData = () => {
    if (currentUser) {
      const storedData = localStorage.getItem(`speakmind_user_data_${currentUser.uid}`)
      return storedData ? JSON.parse(storedData) : null
    }
    return null
  }

  const userData = getUserData()

  const handleLogout = async () => {
    try {
      await logout()
      // Clear user-specific data
      if (currentUser) {
        localStorage.removeItem(`speakmind_user_onboarding_${currentUser.uid}`)
        localStorage.removeItem(`speakmind_user_data_${currentUser.uid}`)
      }
    } catch (error) {
      console.error('Failed to log out:', error)
    }
  }

  return (
    <LanguageWrapper>
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 dark:from-dark-bg dark:via-dark-bg-secondary dark:to-dark-bg relative pb-20 transition-colors duration-300">
        {/* Header */}
        <div className="px-4 md:px-8 lg:px-12 pt-8 md:pt-12 pb-4 md:pb-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between mb-4 md:mb-6">
            <h1 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-dark-text">Profile</h1>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="text-gray-600 dark:text-dark-text-secondary hover:text-gray-800 dark:hover:text-dark-text transition-colors"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Profile Card */}
          <div className="max-w-7xl mx-auto text-center mb-4 md:mb-6">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-orange-200 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 overflow-hidden">
              <img
                src="https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-1">
              {currentUser?.displayName || currentUser?.email?.split('@')[0] || user.name}
            </h2>
            <p className="text-purple-500 font-medium text-sm md:text-base">Level {user.level}</p>
          </div>

          {/* Quick Stats */}
          <div className="max-w-7xl mx-auto grid grid-cols-4 gap-1.5 md:gap-2 mb-4 md:mb-6 px-2 md:px-4">
            <div className="bg-yellow-50 rounded-lg md:rounded-xl p-2 md:p-3 text-center">
              <div className="text-base md:text-lg font-bold text-gray-900">{user.streak}</div>
              <div className="text-[10px] md:text-xs text-gray-600">Days</div>
            </div>
            <div className="bg-pink-50 rounded-lg md:rounded-xl p-2 md:p-3 text-center">
              <div className="text-base md:text-lg font-bold text-gray-900">{user.timemeditated}</div>
              <div className="text-[10px] md:text-xs text-gray-600">Mins</div>
            </div>
            <div className="bg-blue-50 rounded-lg md:rounded-xl p-2 md:p-3 text-center">
              <div className="text-base md:text-lg font-bold text-gray-900">{user.meditations}</div>
              <div className="text-[10px] md:text-xs text-gray-600">Sessions</div>
            </div>
            <div className="bg-green-50 rounded-lg md:rounded-xl p-2 md:p-3 text-center">
              <div className="text-base md:text-lg font-bold text-gray-900">{user.points}</div>
              <div className="text-[10px] md:text-xs text-gray-600">Points</div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="max-w-7xl mx-auto px-2 md:px-4 mb-3 md:mb-4">
            <div className="flex bg-gray-100 rounded-lg md:rounded-xl p-1">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'analytics', label: 'Analytics', icon: '📈' },
                { id: 'achievements', label: 'Achievements', icon: '🏆' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-1 md:gap-2 py-1.5 md:py-2 px-2 md:px-3 rounded-lg text-xs md:text-sm font-medium transition-all ${activeTab === tab.id
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                    }`}
                >
                  <span className="text-sm md:text-base">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Brain Health Summary */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-white">
                      <h4 className="font-semibold text-lg">Brain Health</h4>
                      <p className="text-white/80 text-sm">Last reading: {brainHealthMetrics.lastReading}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{brainHealthMetrics.overall}%</div>
                      <div className="text-white/80 text-sm">Excellent</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/20 rounded-lg p-2">
                      <div className="text-white/90 text-xs">Focus</div>
                      <div className="text-white font-semibold">{brainHealthMetrics.focus}%</div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-2">
                      <div className="text-white/90 text-xs">Stress</div>
                      <div className="text-white font-semibold">{brainHealthMetrics.stress}%</div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-2">
                      <div className="text-white/90 text-xs">Relaxation</div>
                      <div className="text-white font-semibold">{brainHealthMetrics.relaxation}%</div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-2">
                      <div className="text-white/90 text-xs">Sleep</div>
                      <div className="text-white font-semibold">{brainHealthMetrics.sleepQuality}%</div>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate('eegBrainHealth')}
                    className="w-full mt-3 py-2 bg-white/20 text-white rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
                  >
                    View Detailed Analysis →
                  </button>
                </div>

                {/* Quick Insights */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-100">
                  <h4 className="font-semibold text-gray-900 mb-3">This Week's Insights</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Focus improved by 12%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Stress reduced by 8%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Sleep quality up 15%</span>
                    </div>
                  </div>
                </div>

                {/* Recent Sessions */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">Recent Sessions</h4>
                    <button className="text-purple-500 text-sm">View All →</button>
                  </div>
                  <div className="space-y-2">
                    {recentSessions.slice(0, 2).map((session) => (
                      <div key={session.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${session.mood === 'Calm' ? 'bg-blue-500' :
                            session.mood === 'Focused' ? 'bg-purple-500' :
                              session.mood === 'Relaxed' ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                          <span className="text-sm font-medium text-gray-900">{session.type}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-900">{session.duration} min</div>
                          <div className="text-xs text-gray-500">{session.satisfaction}/10</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-4">
                {/* Monthly Progress */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-100">
                  <h4 className="font-semibold text-gray-900 mb-3">Monthly Progress</h4>
                  <div className="space-y-3">
                    {monthlyProgress.slice(0, 3).map((month, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{month.month}</span>
                        <div className="flex-1 mx-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full h-2"
                              style={{ width: `${(month.totalMinutes / 400) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-sm text-gray-900">{month.totalMinutes}m</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-xl p-3">
                    <div className="text-sm text-blue-900 font-medium">Consistency</div>
                    <div className="text-lg font-bold text-blue-900">92%</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3">
                    <div className="text-sm text-green-900 font-medium">Improvement</div>
                    <div className="text-lg font-bold text-green-900">+18%</div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-3">
                    <div className="text-sm text-purple-900 font-medium">Satisfaction</div>
                    <div className="text-lg font-bold text-purple-900">8.5/10</div>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-3">
                    <div className="text-sm text-orange-900 font-medium">Goals</div>
                    <div className="text-lg font-bold text-orange-900">3/4</div>
                  </div>
                </div>

                {/* Brain Health Trends */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-100">
                  <h4 className="font-semibold text-gray-900 mb-3">Weekly Brain Health</h4>
                  <div className="space-y-2">
                    {brainHealthTrends.slice(0, 5).map((trend, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 w-8">{trend.date}</span>
                        <div className="flex-1 mx-2">
                          <div className="flex space-x-1">
                            <div
                              className="bg-purple-400 rounded-sm h-3"
                              style={{ width: `${trend.focus}%` }}
                            ></div>
                            <div
                              className="bg-pink-400 rounded-sm h-3"
                              style={{ width: `${trend.relaxation}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 w-8 text-right">
                          {Math.round((trend.focus + trend.relaxation) / 2)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="space-y-4">
                {/* Achievement Categories */}
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {['All', 'Streak', 'Meditation', 'Brain'].map((category) => (
                    <button
                      key={category}
                      className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${category === 'All'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                {/* Achievements Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {achievements.slice(0, 4).map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`rounded-xl p-3 border ${achievement.unlocked
                        ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200'
                        : 'bg-gray-50 border-gray-200'
                        }`}
                    >
                      <div className="text-center">
                        <div className={`text-2xl mb-1 ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>
                          {achievement.icon}
                        </div>
                        <h5 className={`font-semibold text-xs mb-1 ${achievement.unlocked ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                          {achievement.title}
                        </h5>
                        <div className="w-full bg-gray-200 rounded-full h-1 mb-1">
                          <div
                            className={`h-1 rounded-full ${achievement.unlocked ? 'bg-yellow-400' : 'bg-gray-300'
                              }`}
                            style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {achievement.progress}/{achievement.maxProgress}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Progress Milestones */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-100">
                  <h4 className="font-semibold text-gray-900 mb-3">Progress Milestones</h4>
                  <div className="space-y-3">
                    {milestones.map((milestone) => (
                      <div key={milestone.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{milestone.title}</span>
                          <span className="text-sm text-gray-900">
                            {milestone.current}/{milestone.target}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full h-1.5"
                            style={{ width: `${(milestone.current / milestone.target) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Account Details */}
          <div className="px-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h3>
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600">Email</span>
                <span className="text-gray-900 text-sm font-medium">{currentUser?.email || 'Not provided'}</span>
              </div>
              {userData && (
                <>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-600">Age</span>
                    <span className="text-gray-900 text-sm font-medium">{userData.age}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-600">Gender</span>
                    <span className="text-gray-900 text-sm font-medium">{userData.sex}</span>
                  </div>
                </>
              )}
              <hr className="border-gray-200" />
              <button
                onClick={handleLogout}
                className="w-full bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Settings Modal */}
        {isSettingsOpen && (
          <Suspense fallback={null}>
            <SettingsModal
              isOpen={isSettingsOpen}
              onClose={() => setIsSettingsOpen(false)}
              onNavigate={onNavigate}
            />
          </Suspense>
        )}
      </div>
    </LanguageWrapper>
  )
}
