import { useState } from 'react'
import { useStore, type AIProvider } from '../store'
import { useT } from '../i18n'

const PROVIDERS: { value: AIProvider; label: string }[] = [
  { value: 'groq', label: 'Groq' },
  { value: 'google', label: 'Google Gemini' },
  { value: 'openrouter', label: 'OpenRouter' },
]

interface Props {
  open: boolean
  onClose: () => void
}

export default function SettingsModal({ open, onClose }: Props) {
  const { settings, updateSettings } = useStore()
  const t = useT()
  const [localKey, setLocalKey] = useState(settings.apiKey)
  const [localProvider, setLocalProvider] = useState(settings.provider)

  if (!open) return null

  const handleSave = () => {
    updateSettings({ apiKey: localKey, provider: localProvider })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-[3px] border border-divider bg-canvas p-5 shadow-lg">
        <h2 className="mb-4 text-[14px] font-semibold text-ink">
          {t('settings.title')}
        </h2>

        <label className="mb-3 block">
          <span className="text-[12px] font-medium text-ink-secondary">{t('settings.provider')}</span>
          <select
            value={localProvider}
            onChange={(e) => setLocalProvider(e.target.value as AIProvider)}
            className="mt-1 block h-9 w-full rounded-[3px] border border-divider bg-canvas px-3 text-[13px] text-ink outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
          >
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <label className="mb-4 block">
          <span className="text-[12px] font-medium text-ink-secondary">
            {t('settings.apiKey')}
          </span>
          <input
            type="password"
            value={localKey}
            onChange={(e) => setLocalKey(e.target.value.trim())}
            placeholder="sk-..."
            className="mt-1 block h-9 w-full rounded-[3px] border border-divider bg-canvas px-3 text-[13px] text-ink outline-none placeholder:text-ink-muted focus:border-accent focus:ring-1 focus:ring-accent/30"
          />
          <p className="mt-1 text-[10px] text-ink-muted">
            {t('settings.apiKeyHelp')}
          </p>
        </label>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="inline-flex h-8 items-center rounded-[3px] border border-divider bg-canvas px-3 text-[12px] font-medium text-ink-secondary transition-colors hover:text-ink"
          >
            {t('settings.cancel')}
          </button>
          <button
            onClick={handleSave}
            className="inline-flex h-8 items-center rounded-[3px] bg-ink px-3 text-[12px] font-medium text-canvas transition-opacity hover:opacity-90"
          >
            {t('settings.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
