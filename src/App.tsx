import { useState, useEffect, lazy, Suspense } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { ThemeProvider } from './contexts/ThemeContext'
import BottomNavigation from './components/BottomNavigation'
import ErrorBoundary from './components/ErrorBoundary'

// Lazy load all screens for better performance and code splitting
const AuthScreen = lazy(() => import('./screens/AuthScreen'))
const UserOnboardingScreen = lazy(() => import('./screens/UserOnboardingScreen'))
const HomeScreen = lazy(() => import('./screens/HomeScreen'))
const MeditationScreen = lazy(() => import('./screens/MeditationScreen'))
const JournalScreen = lazy(() => import('./screens/JournalScreen'))
const EmotionalReleaseScreen = lazy(() => import('./screens/EmotionalReleaseScreen'))
const AskQuestionScreen = lazy(() => import('./screens/AskQuestionScreen'))
const StreaksScreen = lazy(() => import('./screens/StreaksScreen'))
const MeditationTimerScreen = lazy(() => import('./screens/MeditationTimerScreen'))
const AICoachScreen = lazy(() => import('./screens/AICoachScreen'))
const MidnightRelaxationScreen = lazy(() => import('./screens/MidnightRelaxationScreen'))
const ProfileScreen = lazy(() => import('./screens/ProfileScreen'))
const SharingScreen = lazy(() => import('./screens/SharingScreen'))
const MindCoachScreen = lazy(() => import('./screens/MindCoachScreen'))
const VedicCalmScreen = lazy(() => import('./screens/VedicCalmScreen'))
const WisdomGitaScreen = lazy(() => import('./screens/WisdomGitaScreen'))
const MidnightLaunderetteScreen = lazy(() => import('./screens/MidnightLaunderetteScreen'))
const ExploreScreen = lazy(() => import('./screens/ExploreScreen'))
const ConversationScreen = lazy(() => import('./screens/ConversationScreen'))
const VoiceSessionScreen = lazy(() => import('./screens/VoiceSessionScreen'))
const EEGBrainHealthScreen = lazy(() => import('./screens/EEGBrainHealthScreen'))
const ThoughtAnalysisScreen = lazy(() => import('./screens/ThoughtAnalysisScreen'))

// Lazy load exercise components
const QuickCalm = lazy(() => import('./components/exercises/QuickCalm'))
const StretchAndFocus = lazy(() => import('./components/exercises/StretchAndFocus'))
const MindBodySync = lazy(() => import('./components/exercises/MindBodySync'))
const ReflectionJournal = lazy(() => import('./components/exercises/ReflectionJournal'))
const ExerciseLayout = lazy(() => import('./components/exercises/ExerciseLayout'))

// Loading component for Suspense fallback
const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      <p className="text-purple-600 font-medium">Loading...</p>
    </div>
  </div>
)

export type Screen = 
  | 'auth'
  | 'userOnboarding'
  | 'home'
  | 'eegBrainHealth'
  | 'meditation'
  | 'journal'
  | 'emotionalRelease'
  | 'askQuestion'
  | 'streaks'
  | 'timer'
  | 'aiCoach'
  | 'profile'
  | 'sharing'
  | 'mindCoach'
  | 'conversation'
  | 'voiceSession'
  | 'exercise-quick-calm'
  | 'exercise-stretch-focus'
  | 'exercise-mind-body-sync'
  | 'exercise-reflection-journal'
  | 'midnightRelaxation'
  | 'midnightLaunderette'
  | 'vedicCalm'
  | 'wisdomGita'
  | 'explore'
  | 'thoughtAnalysis'

const AppContent = () => {
  const { currentUser } = useAuth()
  const [currentScreen, setCurrentScreen] = useState<Screen>('auth')
  const [user, setUser] = useState({
    name: 'Guest',
    streak: 1,
    level: 3,
    timemeditated: 45,
    meditations: 12,
    points: 850
  })

  // Update user name when currentUser changes
  useEffect(() => {
    if (currentUser) {
      const userName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Guest'
      setUser(prev => ({ ...prev, name: userName }))
    } else {
      setUser(prev => ({ ...prev, name: 'Guest' }))
    }
  }, [currentUser])

  useEffect(() => {
    // Only handle automatic navigation when user state changes
    // Don't interfere with manual navigation (like during login/signup flow)
    if (!currentUser) {
      // User logged out - go to auth screen
      if (currentScreen !== 'auth' && currentScreen !== 'userOnboarding') {
        setCurrentScreen('auth')
      }
      return
    }

    // User is logged in - check if we need to navigate
    // Only auto-navigate if we're on auth screen (page refresh scenario)
    if (currentScreen === 'auth') {
      const onboardingKey = `speakmind_user_onboarding_${currentUser.uid}`
      const hasCompletedOnboarding = localStorage.getItem(onboardingKey)

      if (hasCompletedOnboarding) {
        // User has completed onboarding before - go to home
        setCurrentScreen('home')
      } else {
        // First time user - show onboarding
        setCurrentScreen('userOnboarding')
      }
    }
    // For login/signup flows, handleAuthComplete handles navigation
    // so we don't interfere here
  }, [currentUser])

  const handleAuthComplete = (wasSignup: boolean = false, user?: any) => {
    if (!user) return
    
    // Check if user has completed onboarding (for both signup and login)
    const onboardingKey = `speakmind_user_onboarding_${user.uid}`
    const hasCompletedOnboarding = localStorage.getItem(onboardingKey)
    
    if (wasSignup) {
      // New user signup - check if they need onboarding
      if (!hasCompletedOnboarding) {
        setCurrentScreen('userOnboarding')
      } else {
        setCurrentScreen('home')
      }
    } else {
      // Existing user login - check onboarding status
      // If they've completed onboarding before, go to home
      // If not (shouldn't happen for existing users, but handle it), show onboarding
      if (hasCompletedOnboarding) {
        setCurrentScreen('home')
      } else {
        // First time login (shouldn't normally happen, but handle gracefully)
        setCurrentScreen('userOnboarding')
      }
    }
  }

  const handleUserOnboardingComplete = (userData: { age: number; sex: string }) => {
    // Store user data in localStorage (in a real app, you'd store this in Firebase)
    if (currentUser) {
      localStorage.setItem(`speakmind_user_data_${currentUser.uid}`, JSON.stringify(userData))
      localStorage.setItem(`speakmind_user_onboarding_${currentUser.uid}`, 'true')
      setCurrentScreen('home')
    }
  }

  const navigateToScreen = (screen: Screen) => {
    setCurrentScreen(screen)
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'auth':
        return <AuthScreen onAuth={handleAuthComplete} />
      case 'userOnboarding':
        return <UserOnboardingScreen onComplete={handleUserOnboardingComplete} />
      case 'home':
        return <HomeScreen onNavigate={navigateToScreen} user={user} />
      case 'eegBrainHealth':
        return <EEGBrainHealthScreen onNavigate={navigateToScreen} />
      case 'meditation':
        return <MeditationScreen onNavigate={navigateToScreen} />
      case 'journal':
        return <JournalScreen onNavigate={navigateToScreen} user={user} />
      case 'emotionalRelease':
        return <EmotionalReleaseScreen onNavigate={navigateToScreen} user={user} />
      case 'askQuestion':
        return <AskQuestionScreen onNavigate={navigateToScreen} />
      case 'streaks':
        return <StreaksScreen onNavigate={navigateToScreen} user={user} />
      case 'timer':
        return <MeditationTimerScreen onNavigate={navigateToScreen} />
      case 'aiCoach':
        return <AICoachScreen onNavigate={navigateToScreen} />
      case 'midnightRelaxation':
        return <MidnightRelaxationScreen onNavigate={navigateToScreen} />
      case 'midnightLaunderette':
        return <MidnightLaunderetteScreen onNavigate={navigateToScreen} />
      case 'profile':
        return <ProfileScreen onNavigate={navigateToScreen} user={user} />
      case 'sharing':
        return <SharingScreen onNavigate={navigateToScreen} />
      case 'mindCoach':
        return <MindCoachScreen onNavigate={navigateToScreen} user={user} />
      case 'conversation':
        return <ConversationScreen onNavigate={navigateToScreen} />
      case 'voiceSession':
        return <VoiceSessionScreen onNavigate={navigateToScreen} />
      case 'exercise-quick-calm':
        return <QuickCalm onNavigate={navigateToScreen} />
      case 'exercise-stretch-focus':
        return <StretchAndFocus onNavigate={navigateToScreen} />
      case 'exercise-mind-body-sync':
        return <MindBodySync onNavigate={navigateToScreen} />
      case 'exercise-reflection-journal':
        return (
          <ExerciseLayout 
            title="Reflection Journal"
            subtitle="Write one thought to clear your mind"
            backgroundImage="https://images.pexels.com/photos/5273009/pexels-photo-5273009.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2"
            overlayColor="from-rose-500/90 to-pink-600/90"
            onBack={() => navigateToScreen('meditation')}
          >
            <ReflectionJournal onNavigate={navigateToScreen} />
          </ExerciseLayout>
        )
      case 'vedicCalm':
        return <VedicCalmScreen onNavigate={navigateToScreen} />
      case 'wisdomGita':
        return <WisdomGitaScreen onNavigate={navigateToScreen} />
      case 'explore':
        return <ExploreScreen onNavigate={navigateToScreen} />
      case 'thoughtAnalysis':
        return <ThoughtAnalysisScreen onNavigate={navigateToScreen} />
      default:
        return <HomeScreen onNavigate={navigateToScreen} user={user} />
    }
  }

  const showBottomNav = currentUser && currentScreen !== 'auth' && currentScreen !== 'userOnboarding' && currentScreen !== 'timer' && currentScreen !== 'conversation' && currentScreen !== 'voiceSession'

  return (
    <div className="mobile-container min-h-screen overflow-auto">
      <ErrorBoundary>
        <Suspense fallback={<LoadingScreen />}>
          {renderScreen()}
        </Suspense>
      </ErrorBoundary>
      {showBottomNav && (
        <BottomNavigation 
          currentScreen={currentScreen} 
          onNavigate={navigateToScreen} 
        />
      )}
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
