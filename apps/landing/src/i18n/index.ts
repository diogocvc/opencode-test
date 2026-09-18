import { useState, useCallback } from 'react'
import pt from './pt'
import en from './en'

type Locale = 'pt' | 'en'

const STORAGE_KEY = 'editor-blocos-storage'
const dicts = { pt, en } as Record<Locale, Record<string, string>>

function readStoredLocale(): Locale {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.state?.locale === 'en' || parsed.state?.locale === 'pt') {
        return parsed.state.locale
      }
    }
  } catch { /* ignore */ }
  return navigator.language.startsWith('en') ? 'en' : 'pt'
}

function persistLocale(locale: Locale) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    parsed.state = { ...(parsed.state ?? {}), locale }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
  } catch { /* ignore */ }
}

export function useT() {
  const [locale, setLocaleState] = useState<Locale>(readStoredLocale)

  const setLocale = useCallback((loc: Locale) => {
    setLocaleState(loc)
    persistLocale(loc)
  }, [])

  const t = useCallback((key: string): string => {
    return dicts[locale][key] ?? key
  }, [locale])

  return { t, locale, setLocale }
}
