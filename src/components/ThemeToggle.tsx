import React, { useState, useRef, useEffect } from 'react'
import { useTheme, type ThemeMode, type ColorTheme, COLOR_SCHEMES } from '../contexts/ThemeContext'
import { HiSun, HiMoon, HiColorSwatch } from 'react-icons/hi'
import { motion, AnimatePresence } from 'framer-motion'

const ThemeToggle = () => {
  const { theme, setThemeMode, setColorTheme, isDark, colors } = useTheme()
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showModePicker, setShowModePicker] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowColorPicker(false)
        setShowModePicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const colorThemes: ColorTheme[] = ['purple', 'blue', 'green', 'orange', 'pink', 'indigo']
  const themeModes: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Light', icon: <HiSun className="w-5 h-5" /> },
    { value: 'dark', label: 'Dark', icon: <HiMoon className="w-5 h-5" /> },
    { value: 'system', label: 'System', icon: <span className="text-lg">💻</span> }
  ]

  return (
    <div className="relative z-50" ref={dropdownRef}>
      {/* Main Theme Toggle Button */}
      <div className="flex items-center gap-2">
        {/* Color Theme Picker */}
        <div className="relative z-50">
          <button
            onClick={() => {
              setShowColorPicker(!showColorPicker)
              setShowModePicker(false)
            }}
            className="p-2.5 rounded-xl bg-white/80 dark:bg-dark-card backdrop-blur-sm border border-light-border dark:border-dark-border hover:bg-white dark:hover:bg-dark-card-hover transition-all duration-200 shadow-sm"
            aria-label="Change color theme"
          >
            <HiColorSwatch className="w-5 h-5 text-gray-700 dark:text-dark-text" />
          </button>

          <AnimatePresence>
            {showColorPicker && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full right-0 mt-2 bg-white dark:bg-dark-card rounded-2xl shadow-xl border border-light-border dark:border-dark-border p-3 z-[9999] min-w-[200px] max-w-[calc(100vw-2rem)]"
                style={{
                  maxWidth: 'calc(100vw - 2rem)',
                  right: 0,
                  left: 'auto'
                }}
              >
                <div className="text-xs font-semibold text-gray-500 dark:text-dark-text-secondary mb-2 px-2">
                  Color Theme
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {colorThemes.map((color) => {
                    const scheme = COLOR_SCHEMES[color]
                    const isActive = theme.colorTheme === color
                    return (
                      <button
                        key={color}
                        onClick={() => {
                          setColorTheme(color)
                          setShowColorPicker(false)
                          // Force a small delay to ensure state updates
                          setTimeout(() => {
                            window.dispatchEvent(new Event('themechange'))
                          }, 100)
                        }}
                        className={`relative p-3 rounded-xl transition-all duration-200 ${isActive
                          ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-dark-bg ring-current scale-105'
                          : 'hover:scale-105'
                          }`}
                        style={{
                          background: `linear-gradient(135deg, ${scheme.gradientFrom} 0%, ${scheme.gradientTo} 100%)`,
                          color: 'white'
                        }}
                        aria-label={`${color} theme`}
                      >
                        <div className="text-lg mb-1">{scheme.emoji}</div>
                        <div className="text-[10px] font-medium opacity-90">{color}</div>
                        {isActive && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-white dark:bg-dark-card rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-current rounded-full" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
                <div className="mt-2 pt-2 border-t border-light-border dark:border-dark-border">
                  <div className="text-xs text-gray-600 dark:text-dark-text-secondary px-2">
                    {colors.name} {colors.emoji}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dark/Light Mode Toggle */}
        <div className="relative">
          <button
            onClick={() => {
              setShowModePicker(!showModePicker)
              setShowColorPicker(false)
            }}
            className="p-2.5 rounded-xl bg-white/80 dark:bg-dark-card backdrop-blur-sm border border-light-border dark:border-dark-border hover:bg-white dark:hover:bg-dark-card-hover transition-all duration-200 shadow-sm"
            aria-label="Toggle theme mode"
          >
            {isDark ? (
              <HiMoon className="w-5 h-5 text-gray-700 dark:text-dark-text" />
            ) : (
              <HiSun className="w-5 h-5 text-gray-700 dark:text-dark-text" />
            )}
          </button>

          <AnimatePresence>
            {showModePicker && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full right-0 mt-2 bg-white dark:bg-dark-card rounded-2xl shadow-xl border border-light-border dark:border-dark-border p-2 z-[9999] min-w-[140px] max-w-[calc(100vw-2rem)]"
              >
                <div className="text-xs font-semibold text-gray-500 dark:text-dark-text-secondary mb-2 px-2">
                  Theme Mode
                </div>
                {themeModes.map((mode) => {
                  const isActive = theme.mode === mode.value
                  return (
                    <button
                      key={mode.value}
                      onClick={() => {
                        setThemeMode(mode.value)
                        setShowModePicker(false)
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isActive
                        ? 'text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-dark-card-hover text-gray-700 dark:text-dark-text'
                        }`}
                      style={isActive ? {
                        background: `linear-gradient(135deg, ${colors.gradientFrom} 0%, ${colors.gradientTo} 100%)`
                      } : undefined}
                    >
                      <span className="text-lg">{mode.icon}</span>
                      <span className="text-sm font-medium">{mode.label}</span>
                      {isActive && (
                        <span className="ml-auto text-sm">✓</span>
                      )}
                    </button>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// Wrap with React.memo to prevent unnecessary re-renders
export default React.memo(ThemeToggle)
