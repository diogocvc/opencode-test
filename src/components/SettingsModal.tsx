import { useState } from 'react'
import { useStore, type AIProvider } from '../store'

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
  const [localKey, setLocalKey] = useState(settings.apiKey)
  const [localProvider, setLocalProvider] = useState(settings.provider)

  if (!open) return null

  const handleSave = () => {
    updateSettings({ apiKey: localKey, provider: localProvider })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Configuração da IA
        </h2>

        <label className="mb-3 block">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Provedor</span>
          <select
            value={localProvider}
            onChange={(e) => setLocalProvider(e.target.value as AIProvider)}
            className="mt-1 block h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-gray-400 dark:focus:ring-gray-400"
          >
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <label className="mb-4 block">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            API Key
          </span>
          <input
            type="password"
            value={localKey}
            onChange={(e) => setLocalKey(e.target.value.trim())}
            placeholder="sk-..."
            className="mt-1 block h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-400 dark:focus:ring-gray-400"
          />
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-400">
            Sua chave fica armazenada apenas no navegador (localStorage).
          </p>
        </label>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:bg-transparent dark:text-gray-100 dark:hover:bg-gray-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="inline-flex h-10 items-center rounded-lg bg-black px-4 text-sm font-medium text-white hover:bg-gray-900"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
