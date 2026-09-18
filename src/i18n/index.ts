import { useStore } from '../store'
import pt from './pt'
import en from './en'

type Translations = typeof pt
type NestedKey = keyof Translations

const translations: Record<string, Translations> = { pt, en }

function get(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

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

  function t(key: NestedKey, params?: Record<string, string | number>): string {
    const dict = translations[locale] ?? translations.pt
    const raw = get(dict as Record<string, unknown>, key as string)

    if (raw === undefined) return key as string

    if (typeof raw === 'object' && raw !== null && 'one' in raw && 'other' in raw) {
      const n = params?.n ?? 1
      return pluralize(n, raw as { one: string; other: string })
    }

    if (typeof raw === 'string' && params) {
      return interpolate(raw, params)
    }

    return raw as string
  }

  return t
}
