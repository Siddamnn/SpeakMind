import { useState, useEffect, useMemo, useCallback } from 'react'
import { IoSparkles, IoJournal, IoFitness, IoHeadset, IoAnalytics, IoFlame } from 'react-icons/io5'
import type { Screen } from '../App'
import { recommendVideos, type VideoSuggestion } from '../utils/youtubeAI'
import { getContextualSearchQuery, saveUserContext } from '../utils/userContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useTheme } from '../contexts/ThemeContext'

// Import mood images from public folder
import calmImg from '/Homescreen/Calm.gif'
import relaxImg from '/Homescreen/Relax.gif'
import focusImg from '/Homescreen/Focus.gif'
import anxiousImg from '/Homescreen/Anxious.gif'

interface HomeScreenProps {
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

type MoodValue = 'calm' | 'relax' | 'focus' | 'anxious' | null

// Windows 8-style tile configuration
interface Tile {
  id: string
  title: string
  subtitle?: string
  icon?: React.ReactNode
  image: string
  size: 'small' | 'medium' | 'large' | 'wide' | 'tall' | 'extra-large'
  color: string
  onClick: () => void
  gradient?: string
  customHeight?: string // Optional custom height override
}

export default function HomeScreen({ onNavigate, user }: HomeScreenProps) {
  const { t } = useLanguage()
  const { colors } = useTheme()
  const [selectedMood, setSelectedMood] = useState<MoodValue>(null)
  const [videoSuggestions, setVideoSuggestions] = useState<VideoSuggestion[]>([])
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [isLoadingVideos, setIsLoadingVideos] = useState(false)
  const [videoSourceContext, setVideoSourceContext] = useState<'context' | 'mood' | 'default'>('default')

  // Mood to search query mapping
  const moodToQuery: Record<Exclude<MoodValue, null>, string> = {
    calm: 'calming meditation music peaceful relaxation nature sounds calm songs ambient music',
    relax: 'relaxing music yoga meditation gentle music stress relief spa music chill songs',
    focus: 'focus music meditation concentration study music deep focus binaural beats lofi',
    anxious: 'anxiety relief music calming songs breathing meditation peaceful music stress relief'
  }

  const moodPrompts = {
    calm: "You're feeling calm today 🌊",
    relax: "You're feeling relaxed 😌",
    focus: "You're feeling focused 🎯",
    anxious: "You're feeling anxious 😰"
  }

  // Windows 8-style tiles with beautiful cover images - Gallery layout with varied sizes
  // Organized to minimize gaps and create a compact layout
  // Memoized to prevent recreation on every render
  const tiles: Tile[] = useMemo(() => [
    {
      id: 'thought-analysis',
      title: 'Thought Analysis',
      subtitle: 'AI-Powered CBT',
      icon: <IoSparkles className="w-6 h-6" />,
      image: '/homepagetile-coverimages/Thought Analysis.webp',
      size: 'large',
      color: 'from-purple-500 to-pink-500',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
      onClick: () => onNavigate('thoughtAnalysis')
    },
    {
      id: 'meditation',
      title: 'Meditation',
      subtitle: `${user.meditations} sessions`,
      icon: <IoFitness className="w-6 h-6" />,
      image: '/homepagetile-coverimages/meditation.webp',
      size: 'tall',
      color: 'from-blue-500 to-cyan-500',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
      onClick: () => onNavigate('meditation')
    },
    {
      id: 'journal',
      title: 'Journal',
      subtitle: 'Reflect & Grow',
      icon: <IoJournal className="w-6 h-6" />,
      image: '/homepagetile-coverimages/Journal.webp',
      size: 'small',
      color: 'from-orange-500 to-red-500',
      gradient: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
      onClick: () => onNavigate('journal')
    },
    {
      id: 'ai-coach',
      title: 'AI Coach',
      subtitle: 'Ask Anything',
      icon: <IoHeadset className="w-6 h-6" />,
      image: '/homepagetile-coverimages/AI Coach.webp',
      size: 'tall', // Changed from medium to tall for better alignment
      color: 'from-green-500 to-emerald-500',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      onClick: () => onNavigate('askQuestion')
    },
    {
      id: 'vedic-calm',
      title: 'Vedic Calm',
      subtitle: 'Philosophy & Wisdom',
      image: '/homepagetile-coverimages/Vedic Calm.webp',
      size: 'wide',
      color: 'from-amber-500 to-yellow-500',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #eab308 100%)',
      onClick: () => onNavigate('vedicCalm')
    },
    {
      id: 'profile',
      title: 'Profile',
      subtitle: 'Level ' + user.level,
      icon: <IoAnalytics className="w-6 h-6" />,
      image: '/homepagetile-coverimages/Profile.webp',
      size: 'small',
      color: 'from-indigo-500 to-purple-500',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      onClick: () => onNavigate('profile')
    },
    {
      id: 'eeg-brain',
      title: 'EEG Brain Health',
      subtitle: 'Track & Improve',
      image: '/homepagetile-coverimages/EEG Brain Health.webp',
      size: 'small',
      color: 'from-teal-500 to-cyan-500',
      gradient: 'linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)',
      onClick: () => onNavigate('eegBrainHealth')
    },
    {
      id: 'midnight-relax',
      title: 'Midnight Relaxation',
      subtitle: 'Sleep & Calm',
      image: '/homepagetile-coverimages/Midnight Relaxation.webp',
      size: 'medium',
      color: 'from-violet-500 to-purple-500',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
      onClick: () => onNavigate('midnightRelaxation')
    },
    {
      id: 'midnight-launderette',
      title: 'Midnight Launderette',
      subtitle: 'Ambient Sounds',
      image: '/homepagetile-coverimages/Midnight Launderette.webp',
      size: 'medium',
      color: 'from-slate-500 to-gray-500',
      gradient: 'linear-gradient(135deg, #64748b 0%, #6b7280 100%)',
      onClick: () => onNavigate('midnightLaunderette')
    },
    {
      id: 'wisdom-gita',
      title: 'Wisdom Gita',
      subtitle: 'Ancient Insights',
      image: '/homepagetile-coverimages/Wisdom Gita.webp',
      size: 'medium',
      color: 'from-rose-500 to-pink-500',
      gradient: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)',
      onClick: () => onNavigate('wisdomGita')
    }
  ], [user.meditations, user.level, onNavigate])

  // Add YouTube video tile if videos are available - will appear at the end (bottom of grid)
  // Memoized to prevent recreation on every render
  const videoTile: Tile | null = useMemo(() => {
    if (isLoadingVideos || videoSuggestions.length === 0) return null
    return {
    id: 'youtube-videos',
    title: videoSourceContext === 'context' 
      ? '✨ Personalized Videos'
      : videoSourceContext === 'mood' && selectedMood
      ? `${selectedMood.charAt(0).toUpperCase() + selectedMood.slice(1)} Music`
      : 'Meditation Music',
    subtitle: videoSuggestions[currentVideoIndex]?.title?.substring(0, 35) + '...' || 'Watch Now',
    image: videoSuggestions[currentVideoIndex]?.thumbnails?.high?.url || videoSuggestions[currentVideoIndex]?.thumbnails?.medium?.url || 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2',
    size: 'wide',
    color: 'from-red-500 to-pink-500',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)',
      onClick: () => {
        if (videoSuggestions[currentVideoIndex]?.url) {
          window.open(videoSuggestions[currentVideoIndex].url, '_blank')
        }
      }
    }
  }, [isLoadingVideos, videoSuggestions, currentVideoIndex, videoSourceContext, selectedMood])

  // Note: YouTube video tile is rendered separately after regular tiles to appear at bottom

  // Fetch videos when mood changes or on initial load
  useEffect(() => {
    const fetchVideos = async () => {
      setIsLoadingVideos(true)
      try {
        let query: string
        let source: 'context' | 'mood' | 'default'
        
        const contextQuery = getContextualSearchQuery()
        
        if (contextQuery) {
          query = contextQuery
          source = 'context'
        } else if (selectedMood) {
          query = moodToQuery[selectedMood]
          source = 'mood'
        } else {
          query = 'meditation music mindfulness relaxation guided meditation calm music peaceful songs ambient sounds'
          source = 'default'
        }
        
        setVideoSourceContext(source)
        const videos = await recommendVideos(query, '', 6)
        setVideoSuggestions(videos)
        setCurrentVideoIndex(0)
      } catch (error) {
        console.error('Error fetching videos:', error)
        setVideoSuggestions([])
      } finally {
        setIsLoadingVideos(false)
      }
    }

    fetchVideos()
  }, [selectedMood])

  // Auto-rotate videos every 5 seconds
  useEffect(() => {
    if (videoSuggestions.length === 0) return
    const interval = setInterval(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % videoSuggestions.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [videoSuggestions])

  const moods = [
    { emoji: calmImg, label: t('home.calm'), value: 'calm' },
    { emoji: relaxImg, label: t('home.relax'), value: 'relax' },
    { emoji: focusImg, label: t('home.focus'), value: 'focus' },
    { emoji: anxiousImg, label: t('home.anxious'), value: 'anxious' },
  ]

  // Memoized function to get tile size classes
  const getTileSizeClasses = useCallback((size: string) => {
    switch (size) {
      case 'small':
        return 'col-span-1 row-span-1' // 1x1 - smallest
      case 'medium':
        return 'col-span-1 row-span-2' // 1x2 - tall
      case 'large':
        return 'col-span-2 row-span-2' // 2x2 - square large
      case 'wide':
        return 'col-span-2 row-span-1' // 2x1 - wide
      case 'tall':
        return 'col-span-1 row-span-3' // 1x3 - extra tall
      case 'extra-large':
        return 'col-span-2 row-span-3' // 2x3 - extra large
      default:
        return 'col-span-1 row-span-1'
    }
  }, [])
  
  // Memoized hover handlers to prevent recreation on every render
  const handleTileMouseEnter = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const element = e.currentTarget
    element.style.boxShadow = `0 0 20px ${colors.primary}80, 0 0 40px ${colors.primary}40, 0 0 60px ${colors.primary}20`
    element.style.borderColor = colors.primary
  }, [colors.primary])
  
  const handleTileMouseLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const element = e.currentTarget
    element.style.boxShadow = ''
    element.style.borderColor = 'transparent'
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30 dark:from-dark-bg dark:via-dark-bg-secondary dark:to-dark-bg pb-20 transition-colors duration-300">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">
              {t('home.hi')} {user?.name || 'Guest'}
            </h1>
            <p className="text-sm text-gray-600 dark:text-dark-text-secondary">{t('home.howAreYouFeeling')}</p>
          </div>
          <button
            onClick={() => onNavigate('profile')}
            className="p-2 rounded-full bg-white/80 dark:bg-dark-card/80 backdrop-blur-sm hover:bg-white dark:hover:bg-dark-card transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-dark-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </div>

        {/* Day Streak - New Design Above Mood Selector */}
        <button
          onClick={() => onNavigate('streaks')}
          className="w-full mb-3 relative rounded-2xl overflow-hidden group cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, #eab308 0%, #f97316 100%)',
            minHeight: '80px'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-500/20" />
          <div className="relative z-10 flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <IoFlame className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">{user.streak} {t('home.dayStreak')}</h3>
                <p className="text-white/90 text-sm">{t('home.keepGoing')}</p>
              </div>
            </div>
            <div className="text-white/80">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </button>

        {/* Mood Selector - Single Rectangle Container with Circular Frames - Full width to match tiles */}
        <div className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-dark-card p-4">
          <div className="grid grid-cols-4 gap-4">
            {moods.map((mood) => (
              <button
                key={mood.value}
                onClick={() => {
                  setSelectedMood(mood.value as MoodValue)
                  saveUserContext('', '', mood.value as string)
                }}
                className="flex flex-col items-center gap-2 group cursor-pointer transition-all duration-300"
              >
                {/* Circular Frame */}
                <div
                  className={`relative rounded-full overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 bg-white dark:bg-dark-card aspect-square flex items-center justify-center w-full ${
                    selectedMood === mood.value ? 'ring-2' : ''
                  }`}
                  style={selectedMood === mood.value ? {
                    '--tw-ring-color': colors.primary,
                    borderColor: colors.primary
                  } as React.CSSProperties : undefined}
                >
                  {/* Emoji - Centered, reduced size */}
                  <img
                    src={mood.emoji}
                    alt={mood.label}
                    className="w-14 h-14 object-contain"
                  />

                  {/* Selected Indicator - Circular ring */}
                  {selectedMood === mood.value && (
                    <div 
                      className="absolute inset-0 rounded-full border-2"
                      style={{ borderColor: colors.primary }}
                    />
                  )}
                </div>

                {/* Text Label */}
                <span className={`text-xs font-medium transition-colors ${
                  selectedMood === mood.value
                    ? 'text-gray-900 dark:text-dark-text'
                    : 'text-gray-600 dark:text-dark-text-secondary'
                }`}>
                  {mood.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Expandable Mood Banner - Navigates to AI Coach */}
        <div 
          className={`transition-all duration-300 ease-out overflow-hidden mt-3 ${
            selectedMood ? 'max-h-20' : 'max-h-0'
          }`}
        >
          {selectedMood && (
            <div
              className="p-4 cursor-pointer transition-all rounded-xl shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${colors.gradientFrom} 0%, ${colors.gradientTo} 100%)`
              }}
              onClick={() => {
                // Save mood to context for AI Coach to remember
                if (selectedMood) {
                  saveUserContext('', '', selectedMood)
                }
                // Navigate to AI Coach
                onNavigate('askQuestion')
              }}
            >
              <p className="text-white font-medium text-center mb-1 text-sm">
                {moodPrompts[selectedMood]}
              </p>
              <p className="text-white/90 text-xs text-center font-medium">
                {t('home.tapToShare')} →
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Windows 8-Style Tile Grid */}
      <div className="px-4">
        <div className="grid grid-cols-2 gap-3 auto-rows-[100px]" style={{ gridAutoFlow: 'dense' }}>
          {/* Regular Tiles */}
          {tiles.map((tile) => (
            <button
              key={tile.id}
              onClick={tile.onClick}
              className={`${getTileSizeClasses(tile.size)} relative rounded-2xl overflow-hidden group cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]`}
              style={{
                border: '2px solid transparent',
                transition: 'all 0.3s ease'
              } as React.CSSProperties}
              onMouseEnter={handleTileMouseEnter}
              onMouseLeave={handleTileMouseLeave}
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <img
                  src={tile.image}
                  alt={tile.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                {/* Gradient Overlay - Reduced by 20% (from 0.30 to 0.24) */}
                <div 
                  className={`absolute inset-0 bg-gradient-to-br ${tile.color} opacity-24 group-hover:opacity-32 transition-opacity`}
                  style={tile.gradient ? {
                    background: tile.gradient,
                    opacity: 0.24
                  } : undefined}
                />
                {/* Dark Overlay for Text Readability - Increased darkness for better text visibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/30" />
              </div>

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col justify-between p-3 text-white">
                <div>
                  {tile.icon && (
                    <div className="mb-2 opacity-90 group-hover:opacity-100 transition-opacity">
                      {tile.icon}
                    </div>
                  )}
                  <h3 className="font-bold text-sm md:text-base leading-tight mb-1 drop-shadow-lg">
                    {tile.title}
                  </h3>
                  {tile.subtitle && (
                    <p className="text-xs opacity-90 drop-shadow">
                      {tile.subtitle}
                    </p>
                  )}
                </div>
                
                {/* Play/Arrow Indicator - Positioned absolutely to prevent cropping */}
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-7 h-7 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Shine Effect on Hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              </div>
            </button>
          ))}
          
          {/* YouTube Video Tile - Appears at bottom after all other tiles */}
          {videoTile && (
            <button
              key={videoTile.id}
              onClick={videoTile.onClick}
              className={`${getTileSizeClasses(videoTile.size)} relative rounded-2xl overflow-hidden group cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]`}
              style={{
                border: '2px solid transparent',
                transition: 'all 0.3s ease'
              } as React.CSSProperties}
              onMouseEnter={handleTileMouseEnter}
              onMouseLeave={handleTileMouseLeave}
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <img
                  src={videoTile.image}
                  alt={videoTile.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                {/* Gradient Overlay - Reduced by 20% (from 0.30 to 0.24) */}
                <div 
                  className={`absolute inset-0 bg-gradient-to-br ${videoTile.color} opacity-24 group-hover:opacity-32 transition-opacity`}
                  style={videoTile.gradient ? {
                    background: videoTile.gradient,
                    opacity: 0.24
                  } : undefined}
                />
                {/* Dark Overlay for Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/30" />
              </div>

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col justify-between p-3 text-white">
                <div>
                  <h3 className="font-bold text-sm md:text-base leading-tight mb-1 drop-shadow-lg">
                    {videoTile.title}
                  </h3>
                  {videoTile.subtitle && (
                    <p className="text-xs opacity-90 drop-shadow line-clamp-2">
                      {videoTile.subtitle}
                    </p>
                  )}
                </div>
                
                {/* YouTube Play Button - Positioned absolutely to prevent cropping */}
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-7 h-7 bg-red-600/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* YouTube Badge */}
              <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-md text-[10px] font-bold shadow-lg">
                YouTube
              </div>

              {/* Shine Effect on Hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Video Thumbnail Strip - Show all video thumbnails below tiles */}
      {!isLoadingVideos && videoSuggestions.length > 0 && (
        <div className="px-4 mt-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900 dark:text-dark-text">
              {videoSourceContext === 'context' && `✨ ${t('home.personalizedForYou')}`}
              {videoSourceContext === 'mood' && selectedMood &&
                `${selectedMood.charAt(0).toUpperCase() + selectedMood.slice(1)} Music & Videos`
              }
              {videoSourceContext === 'default' && t('home.meditationMusic')}
            </h3>
            <div className="flex items-center gap-1">
              {videoSuggestions.slice(0, 3).map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentVideoIndex % 3
                      ? 'w-6'
                      : 'w-1.5 opacity-40'
                  }`}
                  style={{
                    backgroundColor: index === currentVideoIndex % 3 ? colors.primary : `${colors.primary}40`
                  }}
                />
              ))}
            </div>
          </div>

          {/* Thumbnail Preview Strip */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {videoSuggestions.map((video, index) => (
              <button
                key={video.videoId}
                onClick={() => {
                  setCurrentVideoIndex(index)
                  window.open(video.url, '_blank')
                }}
                className={`relative flex-shrink-0 w-32 h-20 rounded-xl overflow-hidden transition-all duration-300 ${
                  index === currentVideoIndex
                    ? 'ring-2 scale-105 shadow-lg'
                    : 'opacity-70 hover:opacity-100 hover:scale-105'
                }`}
                style={index === currentVideoIndex ? {
                  '--tw-ring-color': colors.primary,
                  borderColor: colors.primary
                } as React.CSSProperties : undefined}
              >
                <img
                  src={video.thumbnails?.medium?.url || video.thumbnails?.default?.url}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-1 left-1 right-1">
                  <p className="text-white text-[10px] font-medium line-clamp-2 drop-shadow">
                    {video.title}
                  </p>
                </div>
                {index === currentVideoIndex && (
                  <div 
                    className="absolute inset-0 border-2 rounded-xl"
                    style={{ borderColor: colors.primary }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
