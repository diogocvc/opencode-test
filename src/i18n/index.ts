import { useStore } from '../store'
import pt from './pt'
import en from './en'

type TranslationValue = string | { one: string; other: string }
type Translations = Record<string, TranslationValue>

const translations: Record<string, Translations> = { pt, en }

export function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    key in params ? String(params[key]) : `{${key}}`,
  )
}

export function pluralize(n: number, forms: { one: string; other: string }): string {
  return n === 1 ? forms.one : forms.other
}

export function useT() {
  const locale = useStore((s) => s.locale)

  function t(key: string, params?: Record<string, string | number>): string {
    const dict = translations[locale] ?? translations.pt
    const raw = dict[key]

    if (raw === undefined) return key

    if (typeof raw === 'object' && 'one' in raw && 'other' in raw) {
      const n = Number(params?.n ?? 1)
      return pluralize(n, raw)
    }

    if (typeof raw === 'string' && params) {
      return interpolate(raw, params)
    }

    return raw as string
  }

  return t
}
