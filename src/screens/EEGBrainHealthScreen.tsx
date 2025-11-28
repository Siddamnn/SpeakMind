import { useState, lazy, Suspense } from 'react'
import type { Screen } from '../App'
const EEGMeditationSession = lazy(() => import('../components/EEGMeditationSession'))
const EEGAnalysisReport = lazy(() => import('../components/EEGAnalysisReport'))
import type { EEGSession } from '../utils/eegService'
import { useLanguage } from '../contexts/LanguageContext'
import { useTheme } from '../contexts/ThemeContext'

interface EEGBrainHealthScreenProps {
  onNavigate: (screen: Screen) => void
}

type ViewState = 'main' | 'session' | 'report'

export default function EEGBrainHealthScreen({ onNavigate }: EEGBrainHealthScreenProps) {
  const { t } = useLanguage()
  const { colors } = useTheme()
  const [viewState, setViewState] = useState<ViewState>('main')
  const [selectedDuration, setSelectedDuration] = useState(10) // minutes
  const [completedSession, setCompletedSession] = useState<EEGSession | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)

  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

  const handleStartSession = () => {
    setViewState('session')
  }

  const handleSessionComplete = (session: EEGSession, analysis: string) => {
    setCompletedSession(session)
    setAiAnalysis(analysis)
    setViewState('report')
  }

  const handleSessionCancel = () => {
    setViewState('main')
  }

  const handleReportClose = () => {
    setViewState('main')
    setCompletedSession(null)
    setAiAnalysis(null)
  }

  // Show session component
  if (viewState === 'session') {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-purple-600 font-medium">Loading session...</p>
          </div>
        </div>
      }>
        <EEGMeditationSession
          duration={selectedDuration}
          onComplete={handleSessionComplete}
          onCancel={handleSessionCancel}
        />
      </Suspense>
    )
  }

  // Show analysis report
  if (viewState === 'report' && completedSession && aiAnalysis) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-purple-600 font-medium">Loading report...</p>
          </div>
        </div>
      }>
        <EEGAnalysisReport
          session={completedSession}
          aiAnalysis={aiAnalysis}
          onClose={handleReportClose}
        />
      </Suspense>
    )
  }

  // Main view
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 dark:from-dark-bg dark:via-dark-bg-secondary dark:to-dark-bg relative pb-20 transition-colors duration-300">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => onNavigate('home')}
            className="p-2 rounded-full bg-white/80 dark:bg-dark-card/80 backdrop-blur-sm"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-dark-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-dark-text">{t('brainHealth.title')}</h1>
          <button
            onClick={() => onNavigate('profile')}
            className="p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </div>

        {/* Localhost Notice */}
        {!isLocalhost && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30 rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-1">{t('brainHealth.eegLocalhostTitle')}</h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  {t('brainHealth.eegLocalhostDesc')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Feature Description */}
        <div className="mb-6 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🧘‍♀️</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">{t('brainHealth.eegMeditationSession')}</h2>
            <p className="text-gray-600">
              {t('brainHealth.connectDevice')}
            </p>
          </div>

          {/* How It Works */}
          <div className="space-y-3 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">{t('brainHealth.howItWorks')}</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start gap-3">
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-semibold text-xs"
                  style={{
                    backgroundColor: `${colors.primary}20`,
                    color: colors.primary
                  }}
                >1</span>
                <span>{t('brainHealth.step1')}</span>
              </div>
              <div className="flex items-start gap-3">
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-semibold text-xs"
                  style={{
                    backgroundColor: `${colors.primary}20`,
                    color: colors.primary
                  }}
                >2</span>
                <span>{t('brainHealth.step2')}</span>
              </div>
              <div className="flex items-start gap-3">
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-semibold text-xs"
                  style={{
                    backgroundColor: `${colors.primary}20`,
                    color: colors.primary
                  }}
                >3</span>
                <span>{t('brainHealth.step3')}</span>
              </div>
              <div className="flex items-start gap-3">
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-semibold text-xs"
                  style={{
                    backgroundColor: `${colors.primary}20`,
                    color: colors.primary
                  }}
                >4</span>
                <span>{t('brainHealth.step4')}</span>
              </div>
              <div className="flex items-start gap-3">
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-semibold text-xs"
                  style={{
                    backgroundColor: `${colors.primary}20`,
                    color: colors.primary
                  }}
                >5</span>
                <span>{t('brainHealth.step5')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Duration Selector */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('brainHealth.selectDuration')}</h3>
          <div className="flex flex-wrap gap-3">
            {[2, 5, 10, 15, 20, 30].map((duration) => (
              <button
                key={duration}
                onClick={() => setSelectedDuration(duration)}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${selectedDuration === duration
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'bg-white/80 backdrop-blur-sm text-gray-700 border border-gray-200'
                  }`}
              >
                {duration} {t('meditation.min')}
              </button>
            ))}
          </div>
        </div>

        {/* Start Session Button */}
        <div className="space-y-3">
          <button
            onClick={handleStartSession}
            disabled={!isLocalhost}
            className={`w-full py-4 font-semibold rounded-2xl shadow-lg transition-all ${isLocalhost
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
          >
            {isLocalhost ? t('brainHealth.startSession') : t('brainHealth.eegAvailableLocalhost')}
          </button>

          <button
            onClick={() => onNavigate('meditation')}
            className="w-full py-3 bg-white/80 backdrop-blur-sm text-gray-700 font-medium rounded-2xl border border-gray-200 hover:bg-white transition-all"
          >
            {t('brainHealth.regularMeditation')}
          </button>
        </div>

        {/* EEG Play Lab - future features */}
        <div className="mt-8 space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text">EEG Play Lab</h3>
          <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-2">
            Explore fun, experimental ways to train your mind with EEG-powered mini experiences.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-dark-card/80 border border-gray-100 dark:border-dark-border flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-dark-text">Focus Balance Game</p>
                  <p className="text-xs text-gray-500 dark:text-dark-text-secondary">
                    Keep your beta waves steady to balance a glowing orb.
                  </p>
                </div>
              </div>
              <span className="inline-flex w-fit mt-1 px-2 py-1 rounded-full bg-purple-50 dark:bg-purple-900/30 text-[10px] font-medium text-purple-600 dark:text-purple-300">
                Coming soon
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/80 dark:bg-dark-card/80 border border-gray-100 dark:border-dark-border flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎵</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-dark-text">Calm Rhythm Trainer</p>
                  <p className="text-xs text-gray-500 dark:text-dark-text-secondary">
                    Breathe with the beat while alpha waves paint ambient visuals.
                  </p>
                </div>
              </div>
              <span className="inline-flex w-fit mt-1 px-2 py-1 rounded-full bg-purple-50 dark:bg-purple-900/30 text-[10px] font-medium text-purple-600 dark:text-purple-300">
                Prototype
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
