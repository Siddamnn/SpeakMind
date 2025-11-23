import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import type { ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

export type ColorTheme =
  | 'purple'  // Calm & Serene (default)
  | 'blue'    // Ocean & Tranquility
  | 'green'   // Nature & Growth
  | 'orange'  // Energy & Warmth
  | 'pink'    // Love & Compassion
  | 'indigo'  // Deep Focus

export interface Theme {
  mode: ThemeMode
  colorTheme: ColorTheme
  effectiveMode: 'light' | 'dark' // Resolved mode (light/dark/system -> light/dark)
}

interface ThemeContextType {
  theme: Theme
  setThemeMode: (mode: ThemeMode) => void
  setColorTheme: (color: ColorTheme) => void
  toggleTheme: () => void
  isDark: boolean
  colors: ColorScheme
}

interface ColorScheme {
  primary: string
  secondary: string
  accent: string
  gradient: string
  gradientFrom: string
  gradientTo: string
  name: string
  emoji: string
}

export const COLOR_SCHEMES: Record<ColorTheme, ColorScheme> = {
  purple: {
    primary: '#9D7CF3',
    secondary: '#FFB8C4',
    accent: '#FDC75E',
    gradient: 'from-purple-500 to-pink-500',
    gradientFrom: '#9D7CF3',
    gradientTo: '#FFB8C4',
    name: 'Calm & Serene',
    emoji: '💜'
  },
  blue: {
    primary: '#3B82F6',
    secondary: '#60A5FA',
    accent: '#34D399',
    gradient: 'from-blue-500 to-cyan-400',
    gradientFrom: '#3B82F6',
    gradientTo: '#60A5FA',
    name: 'Ocean & Tranquility',
    emoji: '🌊'
  },
  green: {
    primary: '#10B981',
    secondary: '#34D399',
    accent: '#FBBF24',
    gradient: 'from-green-500 to-emerald-400',
    gradientFrom: '#10B981',
    gradientTo: '#34D399',
    name: 'Nature & Growth',
    emoji: '🌿'
  },
  orange: {
    primary: '#F97316',
    secondary: '#FB923C',
    accent: '#FCD34D',
    gradient: 'from-orange-500 to-amber-400',
    gradientFrom: '#F97316',
    gradientTo: '#FB923C',
    name: 'Energy & Warmth',
    emoji: '🔥'
  },
  pink: {
    primary: '#EC4899',
    secondary: '#F472B6',
    accent: '#FBBF24',
    gradient: 'from-pink-500 to-rose-400',
    gradientFrom: '#EC4899',
    gradientTo: '#F472B6',
    name: 'Love & Compassion',
    emoji: '💗'
  },
  indigo: {
    primary: '#6366F1',
    secondary: '#818CF8',
    accent: '#A78BFA',
    gradient: 'from-indigo-500 to-purple-400',
    gradientFrom: '#6366F1',
    gradientTo: '#818CF8',
    name: 'Deep Focus',
    emoji: '🔮'
  }
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('speakmind_theme_mode')
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      return saved as ThemeMode
    }
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'system'
    }
    return 'light'
  })

  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    const saved = localStorage.getItem('speakmind_color_theme')
    if (saved && Object.keys(COLOR_SCHEMES).includes(saved)) {
      return saved as ColorTheme
    }
    return 'purple'
  })

  // Resolve effective mode (system -> light/dark)
  const getEffectiveMode = (): 'light' | 'dark' => {
    if (themeMode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return themeMode
  }

  const [effectiveMode, setEffectiveMode] = useState<'light' | 'dark'>(getEffectiveMode())

  // Update effective mode when theme or system preference changes
  useEffect(() => {
    const updateEffectiveMode = () => {
      setEffectiveMode(getEffectiveMode())
    }

    updateEffectiveMode()

    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', updateEffectiveMode)
      return () => mediaQuery.removeEventListener('change', updateEffectiveMode)
    }
  }, [themeMode])

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    const isDark = effectiveMode === 'dark'

    // Set data attributes for theme
    root.setAttribute('data-theme', colorTheme)
    root.setAttribute('data-mode', effectiveMode)

    // Apply dark mode class
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    // Set CSS variables for color theme
    const colors = COLOR_SCHEMES[colorTheme]
    root.style.setProperty('--theme-primary', colors.primary)
    root.style.setProperty('--theme-secondary', colors.secondary)
    root.style.setProperty('--theme-accent', colors.accent)
    root.style.setProperty('--theme-gradient-from', colors.gradientFrom)
    root.style.setProperty('--theme-gradient-to', colors.gradientTo)

    // Convert hex to RGB for opacity support
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '157, 124, 243'
    }
    root.style.setProperty('--theme-primary-rgb', hexToRgb(colors.primary))
  }, [colorTheme, effectiveMode])

  // Memoize setThemeMode to prevent unnecessary re-renders
  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode)
    localStorage.setItem('speakmind_theme_mode', mode)
  }, [])

  // Memoize setColorTheme to prevent unnecessary re-renders
  const setColorTheme = useCallback((color: ColorTheme) => {
    setColorThemeState(color)
    localStorage.setItem('speakmind_color_theme', color)
  }, [])

  // Memoize toggleTheme to prevent unnecessary re-renders
  const toggleTheme = useCallback(() => {
    const newMode = effectiveMode === 'light' ? 'dark' : 'light'
    setThemeModeState(newMode)
    localStorage.setItem('speakmind_theme_mode', newMode)
  }, [effectiveMode])

  // Memoize theme object
  const theme: Theme = useMemo(() => ({
    mode: themeMode,
    colorTheme,
    effectiveMode
  }), [themeMode, colorTheme, effectiveMode])

  // Memoize colors
  const colors = useMemo(() => COLOR_SCHEMES[colorTheme], [colorTheme])
  const isDark = effectiveMode === 'dark'

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    theme,
    setThemeMode,
    setColorTheme,
    toggleTheme,
    isDark,
    colors
  }), [theme, setThemeMode, setColorTheme, toggleTheme, isDark, colors])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

