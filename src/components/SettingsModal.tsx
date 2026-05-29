import { useState } from 'react'
import { useStore, type AIProvider } from '../store'

const PROVIDERS: { value: AIProvider; label: string; browser: boolean }[] = [
  { value: 'openai', label: 'OpenAI', browser: false },
  { value: 'anthropic', label: 'Anthropic', browser: false },
  { value: 'groq', label: 'Groq', browser: true },
  { value: 'google', label: 'Google Gemini', browser: true },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100">
          Configuração da IA
        </h2>

        <label className="mb-3 block">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Provedor</span>
          <select
            value={localProvider}
            onChange={(e) => setLocalProvider(e.target.value as AIProvider)}
            className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          >
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label} {p.browser ? '✅' : ''}
              </option>
            ))}
          </select>
          {!PROVIDERS.find((p) => p.value === localProvider)?.browser && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              ⚠ OpenAI e Anthropic não funcionam direto do navegador (CORS). Use Groq ou Google Gemini.
            </p>
          )}
        </label>

        <label className="mb-4 block">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            API Key
          </span>
          <input
            type="password"
            value={localKey}
            onChange={(e) => setLocalKey(e.target.value)}
            placeholder="sk-..."
            className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Sua chave fica armazenada apenas no navegador (localStorage).
          </p>
        </label>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
