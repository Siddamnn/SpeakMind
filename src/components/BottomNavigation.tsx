import React from 'react'
import type { Screen } from '../App'
import { AiOutlineHome } from 'react-icons/ai'
import { PiFlowerLotusLight, PiHandsPrayingLight } from 'react-icons/pi'
import { HiOutlineChatAlt2 } from 'react-icons/hi'
import { FaBrain } from 'react-icons/fa'
import { GlassFilter, type DockIcon } from './ui/liquid-glass'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../contexts/LanguageContext'
import { useTheme } from '../contexts/ThemeContext'

interface BottomNavigationProps {
  currentScreen: Screen
  onNavigate: (screen: Screen) => void
}

const BottomNavigation = ({ currentScreen, onNavigate }: BottomNavigationProps) => {
  const { t } = useLanguage()
  const { colors, isDark } = useTheme()
  const [isHovered, setIsHovered] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const navItems: DockIcon[] = [
    {
      icon: AiOutlineHome,
      label: t('navigation.home'),
      onClick: () => onNavigate('home'),
      isActive: currentScreen === 'home'
    },
    {
      icon: PiFlowerLotusLight,
      label: t('navigation.meditation'),
      onClick: () => onNavigate('meditation'),
      isActive: currentScreen === 'meditation'
    },
    {
      icon: PiHandsPrayingLight,
      label: t('navigation.mindCoach'),
      onClick: () => onNavigate('mindCoach'),
      isActive: currentScreen === 'mindCoach'
    },
    {
      icon: HiOutlineChatAlt2,
      label: t('navigation.sharing'),
      onClick: () => onNavigate('sharing'),
      isActive: currentScreen === 'sharing'
    },
    {
      icon: FaBrain,
      label: t('navigation.brainHealth'),
      onClick: () => onNavigate('eegBrainHealth'),
      isActive: currentScreen === 'eegBrainHealth'
    },
  ]

  const activeItem = navItems.find(item => item.isActive) || navItems[0]

  // Determine if navigation should be shown (hover or click-expanded)
  const showFullNav = isHovered || isExpanded

  // Handle click to toggle expansion
  const handleToggle = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <>
      <GlassFilter />
      <div className="fixed bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 z-50">
        <motion.div
          className="relative flex items-center justify-center overflow-hidden backdrop-blur-xl border shadow-2xl"
          style={{
            backgroundColor: isDark 
              ? 'rgba(17, 24, 39, 0.85)' // Dark gray with high opacity
              : 'rgba(255, 255, 255, 0.75)', // Light with good opacity
            borderColor: isDark 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'rgba(255, 255, 255, 0.3)',
            boxShadow: isDark
              ? "0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)"
              : "0 6px 6px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 0, 0, 0.1)",
            willChange: "transform, width, height, border-radius",
          }}
          initial={false}
          animate={{
            width: showFullNav ? 'auto' : '60px',
            height: '60px',
            borderRadius: showFullNav ? '24px' : '30px',
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleToggle}
        >
          {/* Glass Layers - Dark mode optimized */}
          <div
            className="absolute inset-0 z-0 overflow-hidden rounded-inherit"
            style={{
              backdropFilter: "blur(20px)",
              filter: "url(#glass-distortion)",
              isolation: "isolate",
            }}
          />
          <div
            className="absolute inset-0 z-10 rounded-inherit"
            style={{ 
              background: isDark 
                ? "rgba(255, 255, 255, 0.05)" 
                : "rgba(255, 255, 255, 0.25)" 
            }}
          />
          <div
            className="absolute inset-0 z-20 rounded-inherit overflow-hidden"
            style={{
              boxShadow: isDark
                ? "inset 0 1px 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.3)"
                : "inset 2px 2px 1px 0 rgba(255, 255, 255, 0.5), inset -1px -1px 1px 1px rgba(255, 255, 255, 0.5)",
            }}
          />

          {/* Content */}
          <div className="relative z-30 flex items-center px-2 h-full">
            <AnimatePresence mode="wait">
              {!showFullNav ? (
                <motion.div
                  key="active-icon"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center w-full h-full"
                >
                  <activeItem.icon
                    className="text-2xl"
                    style={{ color: colors.primary }}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="full-menu"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                  className="flex items-center gap-3 md:gap-4 px-2"
                >
                  {navItems.map((item, index) => (
                    <div
                      key={index}
                      className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition-all duration-300 hover:scale-110 p-1.5 rounded-xl ${
                        item.isActive 
                          ? "" 
                          : isDark 
                            ? "text-gray-300 hover:text-gray-100" 
                            : "text-gray-600 hover:text-gray-800"
                      }`}
                      style={item.isActive ? { color: colors.primary } : undefined}
                      onMouseEnter={(e) => {
                        if (!item.isActive) {
                          e.currentTarget.style.color = colors.primary
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!item.isActive) {
                          e.currentTarget.style.color = ''
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation() // Prevent triggering the parent's toggle
                        item.onClick()
                        setIsExpanded(false) // Collapse after navigation
                      }}
                    >
                      <item.icon className="text-2xl" />
                      <span className="text-[10px] md:text-xs font-medium whitespace-nowrap">{item.label}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </>
  )
}

// Wrap with React.memo to prevent unnecessary re-renders
export default React.memo(BottomNavigation)
