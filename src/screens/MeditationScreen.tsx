// src/screens/MeditationScreen.tsx
import { useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { IoFitness, IoMoon, IoHeart, IoHappy, IoPeople, IoSparkles, IoFlame, IoBody, IoJournal } from 'react-icons/io5';

interface Exercise {
  id: string;
  titleKey: string;
  descriptionKey: string;
  category: string;
  duration: number;
  image: string;
  size: 'small' | 'medium' | 'large' | 'wide' | 'tall';
  color: string;
  gradient: string;
  icon: React.ReactNode;
  customRowSpan?: number; // Optional custom row-span override
}

interface MeditationScreenProps {
  onNavigate?: (screen: any) => void;
}

const MeditationScreen = ({ onNavigate }: MeditationScreenProps = {}) => {
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  
  // Windows 8-style tiles with varied sizes for organized layout
  // Reorganized for better visual flow, proper spacing, and minimal gaps
  const exercises: Exercise[] = useMemo(() => [
    {
      id: 'quick-calm',
      titleKey: 'meditation.quickCalm',
      descriptionKey: 'meditation.quickCalmDesc',
      category: 'breathing',
      duration: 5,
      image: 'https://images.pexels.com/photos/4056535/pexels-photo-4056535.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2',
      size: 'large',
      color: 'from-teal-500 to-emerald-600',
      gradient: 'linear-gradient(135deg, #14b8a6 0%, #059669 100%)',
      icon: <IoFitness className="w-6 h-6" />,
    },
    {
      id: 'stress-buster',
      titleKey: 'meditation.stressBuster',
      descriptionKey: 'meditation.stressBusterDesc',
      category: 'stress-relief',
      duration: 7,
      image: 'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2',
      size: 'tall',
      color: 'from-orange-500 to-red-600',
      gradient: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
      icon: <IoFlame className="w-6 h-6" />,
    },
    {
      id: 'anxiety-sos',
      titleKey: 'meditation.anxietySOS',
      descriptionKey: 'meditation.anxietySOSDesc',
      category: 'anxiety',
      duration: 10,
      image: 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2',
      size: 'medium',
      color: 'from-blue-500 to-cyan-600',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #0891b2 100%)',
      icon: <IoHeart className="w-6 h-6" />,
    },
    {
      id: 'mood-booster',
      titleKey: 'meditation.moodBooster',
      descriptionKey: 'meditation.moodBoosterDesc',
      category: 'mood',
      duration: 8,
      image: 'https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2',
      size: 'medium',
      color: 'from-yellow-500 to-orange-500',
      gradient: 'linear-gradient(135deg, #eab308 0%, #f97316 100%)',
      icon: <IoHappy className="w-6 h-6" />,
    },
    {
      id: 'social-confidence',
      titleKey: 'meditation.socialConfidence',
      descriptionKey: 'meditation.socialConfidenceDesc',
      category: 'confidence',
      duration: 12,
      image: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2',
      size: 'medium', // Increased from small to medium (25% size increase)
      color: 'from-pink-500 to-rose-600',
      gradient: 'linear-gradient(135deg, #ec4899 0%, #e11d48 100%)',
      icon: <IoPeople className="w-6 h-6" />,
    },
    {
      id: 'stretch-focus',
      titleKey: 'meditation.stretchFocus',
      descriptionKey: 'meditation.stretchFocusDesc',
      category: 'movement',
      duration: 10,
      image: 'https://images.pexels.com/photos/3768918/pexels-photo-3768918.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2',
      size: 'tall', // Increased to tall (row-span-3) to fill gap
      color: 'from-amber-500 to-orange-600',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
      icon: <IoBody className="w-6 h-6" />,
    },
    {
      id: 'mind-body-sync',
      titleKey: 'meditation.mindBodySync',
      descriptionKey: 'meditation.mindBodySyncDesc',
      category: 'mindfulness',
      duration: 15,
      image: 'https://images.pexels.com/photos/3759657/pexels-photo-3759657.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2',
      size: 'medium', // Increased from small to medium (25% size increase)
      color: 'from-violet-500 to-purple-600',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #9333ea 100%)',
      icon: <IoSparkles className="w-6 h-6" />,
    },
    {
      id: 'sleep-stories',
      titleKey: 'meditation.sleepStories',
      descriptionKey: 'meditation.sleepStoriesDesc',
      category: 'sleep',
      duration: 20,
      image: 'https://images.pexels.com/photos/18554368/pexels-photo-18554368.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2',
      size: 'wide',
      customRowSpan: 2, // 15% height increase - use row-span-2 for proper spacing
      color: 'from-indigo-500 to-purple-600',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)',
      icon: <IoMoon className="w-6 h-6" />,
    },
    {
      id: 'reflection-journal',
      titleKey: 'meditation.reflectionJournal',
      descriptionKey: 'meditation.reflectionJournalDesc',
      category: 'reflection',
      duration: 3,
      image: 'https://images.pexels.com/photos/6621339/pexels-photo-6621339.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2',
      size: 'wide',
      color: 'from-rose-500 to-pink-600',
      gradient: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)',
      icon: <IoJournal className="w-6 h-6" />,
    },
  ], []);

  // Load progress from localStorage (for future use)
  useEffect(() => {
    const savedProgress = localStorage.getItem('dailyExerciseProgress');
    if (savedProgress) {
      // Progress tracking available for future features
    }
  }, []);

  const handleExercisePress = (exerciseId: string) => {
    if (onNavigate) {
      // Map exercise IDs to screen names
      const exerciseScreenMap: Record<string, string> = {
        'quick-calm': 'exercise-quick-calm',
        'stretch-focus': 'exercise-stretch-focus',
        'mind-body-sync': 'exercise-mind-body-sync',
        'reflection-journal': 'journal',
        'stress-buster': 'exercise-stress-buster',
        'sleep-stories': 'exercise-sleep-stories',
        'anxiety-sos': 'exercise-anxiety-sos',
        'mood-booster': 'exercise-mood-booster',
        'social-confidence': 'exercise-social-confidence',
      };
      
      const screenName = exerciseScreenMap[exerciseId];
      if (screenName) {
        onNavigate(screenName);
      } else {
        console.log('Exercise not found:', exerciseId);
      }
    } else {
      console.log('Navigate to exercise:', exerciseId);
    }
  };

  // Memoized function to get tile size classes
  const getTileSizeClasses = useCallback((size: string, customRowSpan?: number) => {
    switch (size) {
      case 'small':
        return 'col-span-1 row-span-1' // 1x1 - smallest
      case 'medium':
        return 'col-span-1 row-span-2' // 1x2 - tall
      case 'large':
        return 'col-span-2 row-span-2' // 2x2 - square large
      case 'wide':
        // Use customRowSpan if provided, otherwise default to row-span-1
        if (customRowSpan) {
          return `col-span-2 row-span-[${customRowSpan}]` // Use Tailwind arbitrary value
        }
        return 'col-span-2 row-span-1' // 2x1 - wide
      case 'tall':
        return 'col-span-1 row-span-3' // 1x3 - extra tall
      default:
        return 'col-span-1 row-span-1'
    }
  }, [])
  
  
  // Memoized hover handlers
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
    <div className="min-h-screen relative overflow-hidden pb-20">
      {/* Breathing Background - Dark Theme (Night Sky Image) */}
      {isDark && (
        <>
          {/* Night sky image with subtle breathing animation */}
          <div 
            className="absolute inset-0 animate-breathe"
            style={{
              backgroundImage: 'url(/Homescreen/night_sky.webp)',
              backgroundSize: 'cover',
              backgroundPosition: 'center 40%', // Shift to show middle area on phone screens
              backgroundRepeat: 'no-repeat',
              filter: 'brightness(0.4)', // 60% brightness reduction (40% more from previous 20%)
              willChange: 'transform'
            }}
          />
        </>
      )}
      
      {/* Breathing Background - Light Theme (Day Sky Image) */}
      {!isDark && (
        <>
          {/* Day sky image with subtle breathing animation */}
          <div 
            className="absolute inset-0 animate-breathe"
            style={{
              backgroundImage: 'url(/Homescreen/days_sky.webp)',
              backgroundSize: 'cover',
              backgroundPosition: 'center 40%', // Shift to show middle area on phone screens
              backgroundRepeat: 'no-repeat',
              willChange: 'transform'
            }}
          />
        </>
      )}
      
      {/* Content Container */}
      <div className="relative z-10">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">
            {t('meditation.mindfulMoments')}
          </h1>
          <button
            onClick={() => onNavigate?.('profile')}
            className="p-2 rounded-full bg-white/80 dark:bg-dark-card/80 backdrop-blur-sm hover:bg-white dark:hover:bg-dark-card transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-dark-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-4">
          {t('meditation.subtitle') || 'Choose an exercise to begin your wellness journey'}
        </p>
      </div>

      {/* Windows 8-Style Tile Grid */}
      <div className="px-4">
        <div className="grid grid-cols-2 gap-3 auto-rows-[100px]" style={{ gridAutoFlow: 'dense' }}>
          {exercises.map((exercise) => (
            <motion.button
              key={exercise.id}
              onClick={() => handleExercisePress(exercise.id)}
              whileTap={{ scale: 0.98 }}
              className={`${getTileSizeClasses(exercise.size, exercise.customRowSpan)} relative rounded-2xl overflow-hidden group cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]`}
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
                  src={exercise.image}
                  alt={t(exercise.titleKey)}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                {/* Gradient Overlay - Reduced by 20% (from 0.10 to 0.08) */}
                <div 
                  className={`absolute inset-0 bg-gradient-to-br ${exercise.color} opacity-8 group-hover:opacity-12 transition-opacity`}
                  style={{
                    background: exercise.gradient,
                    opacity: 0.08
                  }}
                />
                {/* Dark Overlay for Text Readability - Reduced for better image visibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
                {/* Mild Dark Vignette */}
                <div 
                  className="absolute inset-0"
                  style={{
                    background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.3) 100%)'
                  }}
                />
              </div>

              {/* Glassmorphism Content Container */}
              <div className="relative z-10 h-full flex flex-col justify-between p-3 text-white">
                <div>
                  {/* Icon with Glassmorphism */}
                  <div className="mb-2 opacity-90 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-xl bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/10 flex items-center justify-center shadow-lg">
                      {exercise.icon}
                    </div>
                  </div>
                  <h3 className="font-bold text-sm md:text-base leading-tight mb-1 drop-shadow-lg">
                    {t(exercise.titleKey)}
                  </h3>
                  <p className="text-xs opacity-90 drop-shadow line-clamp-2">
                    {t(exercise.descriptionKey)}
                  </p>
                </div>
                
                {/* Bottom Section with Duration Badge */}
                <div className="flex items-center justify-between">
                  {/* Duration Badge with Glassmorphism */}
                  <div className="bg-white/20 dark:bg-black/30 backdrop-blur-md border border-white/30 dark:border-white/20 px-2 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <span className="text-[10px] font-medium">{exercise.duration} {t('meditation.min')}</span>
                  </div>
                  
                  {/* Play Button with Glassmorphism */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-7 h-7 bg-white/20 dark:bg-black/30 backdrop-blur-md border border-white/30 dark:border-white/20 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shine Effect on Hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
      </div>
    </div>
  )
}

export default MeditationScreen
