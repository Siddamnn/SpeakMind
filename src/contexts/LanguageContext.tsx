import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import type { ReactNode } from 'react'

export type LanguageCode =
  | 'en'  // English
  | 'hi'  // Hindi
  | 'bn'  // Bengali
  | 'te'  // Telugu
  | 'mr'  // Marathi
  | 'ta'  // Tamil
  | 'gu'  // Gujarati
  | 'kn'  // Kannada
  | 'ml'  // Malayalam
  | 'pa'  // Punjabi
  | 'or'  // Odia

export interface Language {
  code: LanguageCode
  name: string
  nativeName: string
  flag: string
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳' }
]

interface LanguageContextType {
  language: LanguageCode
  setLanguage: (lang: LanguageCode) => void
  t: (key: string, params?: Record<string, string | number>) => string
  currentLanguage: Language
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
  children: ReactNode
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    // Load from localStorage or default to English
    const saved = localStorage.getItem('speakmind_language')
    return (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved))
      ? (saved as LanguageCode)
      : 'en'
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [translations, setTranslations] = useState<any>({})
  const [isLoading, setIsLoading] = useState(true)

  // Pre-import all translation files for better reliability
  const translationModules = {
    en: () => import('../locales/en.json'),
    hi: () => import('../locales/hi.json'),
    bn: () => import('../locales/bn.json'),
    te: () => import('../locales/te.json'),
    mr: () => import('../locales/mr.json'),
    ta: () => import('../locales/ta.json'),
    gu: () => import('../locales/gu.json'),
    kn: () => import('../locales/kn.json'),
    ml: () => import('../locales/ml.json'),
    pa: () => import('../locales/pa.json'),
    or: () => import('../locales/or.json'),
  }

  // Load translations when language changes
  useEffect(() => {
    const loadTranslations = async () => {
      setIsLoading(true)
      try {
        // Use pre-defined import function
        const loadFn = translationModules[language]
        if (loadFn) {
          const translationModule = await loadFn()
          // Handle both default export and named export
          const translationsData = translationModule.default || translationModule
          setTranslations(translationsData || {})
        } else {
          // Fallback to English
          const enModule = await translationModules.en()
          const enData = enModule.default || enModule
          setTranslations(enData || {})
        }
      } catch (error) {
        console.error(`Failed to load translations for ${language}:`, error)
        // Fallback to English
        try {
          const englishModule = await translationModules.en()
          const englishData = englishModule.default || englishModule
          setTranslations(englishData || {})
        } catch (e) {
          console.error('Failed to load English fallback:', e)
          setTranslations({})
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadTranslations()
  }, [language])

  // Memoize setLanguage to prevent re-creating function on every render
  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang)
    localStorage.setItem('speakmind_language', lang)
  }, [])

  // Memoize translation function to prevent re-creating on every render
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    // Handle nested keys like "home.hi" -> translations.home.hi
    const keys = key.split('.')
    let translation: any = translations

    // Navigate through nested object
    for (const k of keys) {
      if (translation && typeof translation === 'object' && k in translation) {
        translation = translation[k]
      } else {
        // Key not found, log for debugging and return the key itself
        if (process.env['NODE_ENV'] === 'development') {
          console.warn(`Translation key not found: ${key}`, { translations, currentKey: k })
        }
        return key
      }
    }

    // If translation is not a string, return the key
    if (typeof translation !== 'string') {
      if (process.env['NODE_ENV'] === 'development') {
        console.warn(`Translation value is not a string for key: ${key}`, translation)
      }
      return key
    }

    // Replace parameters in translation
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        translation = translation.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(value))
      })
    }

    return translation
  }, [translations])

  // Memoize current language lookup
  const currentLanguage = useMemo(
    () => SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0],
    [language]
  )

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
    currentLanguage
  }), [language, setLanguage, t, currentLanguage])

  return (
    <LanguageContext.Provider value={value}>
      {!isLoading && children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

