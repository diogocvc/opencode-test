import type { AIProvider } from './store'

export type AIErrorCode = 'auth' | 'rate_limit' | 'timeout' | 'server_error' | 'network' | 'unknown'

export class AIError extends Error {
  code: AIErrorCode

  constructor(message: string, code: AIErrorCode) {
    super(message)
    this.name = 'AIError'
    this.code = code
  }
}

const API_URLS: Record<AIProvider, string> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  anthropic: 'https://api.anthropic.com/v1/messages',
  groq: 'https://api.groq.com/openai/v1/chat/completions',
  google: 'https://generativelanguage.googleapis.com/v1beta/models',
}

const TIMEOUT_MS = 30_000

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    return res
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new AIError('A requisição excedeu o tempo limite. Tente novamente.', 'timeout')
    }
    throw new AIError('Erro de conexão. Verifique sua internet.', 'network')
  } finally {
    clearTimeout(timeoutId)
  }
}

async function handleResponseError(res: Response): Promise<void> {
  if (!res.ok) {
    if (res.status === 401 || res.status === 403)
      throw new AIError('API Key inválida ou expirada. Verifique suas configurações.', 'auth')
    if (res.status === 429)
      throw new AIError('Limite de requisições excedido. Aguarde um momento e tente novamente.', 'rate_limit')
    if (res.status >= 500)
      throw new AIError('Erro no servidor do provedor. Tente novamente mais tarde.', 'server_error')
    throw new AIError(`Erro inesperado (${res.status}). Tente novamente.`, 'unknown')
  }
}

async function readSSEStream(
  res: Response,
  onData: (data: string) => void,
): Promise<void> {
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('data: ')) {
        const data = trimmed.slice(6)
        if (data === '[DONE]') continue
        onData(data)
      }
    }
  }
}

async function callOpenAI(apiKey: string, model: string, system: string, user: string) {
  const res = await fetchWithTimeout(API_URLS.openai, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
  })
  await handleResponseError(res)
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

async function callAnthropic(apiKey: string, model: string, system: string, user: string) {
  const res = await fetchWithTimeout(API_URLS.anthropic, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model, system, messages: [{ role: 'user', content: user }], max_tokens: 1024 }),
  })
  await handleResponseError(res)
  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}

async function callGroq(apiKey: string, model: string, system: string, user: string) {
  const res = await fetchWithTimeout(API_URLS.groq, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
  })
  await handleResponseError(res)
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

async function callGoogle(apiKey: string, model: string, system: string, user: string) {
  const url = `${API_URLS.google}/${model}:generateContent?key=${apiKey}`
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: `${system}\n\n${user}` }] }] }),
  })
  await handleResponseError(res)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

const PROVIDER_CALLERS: Record<AIProvider, (key: string, model: string, system: string, user: string) => Promise<string>> = {
  openai: callOpenAI,
  anthropic: callAnthropic,
  groq: callGroq,
  google: callGoogle,
}

export async function callAI(provider: AIProvider, apiKey: string, model: string, system: string, user: string) {
  const caller = PROVIDER_CALLERS[provider]
  return caller(apiKey, model, system, user)
}

async function callOpenAIStream(
  apiKey: string, model: string, system: string, user: string, onChunk: (text: string) => void,
): Promise<string> {
  const res = await fetchWithTimeout(API_URLS.openai, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      stream: true,
    }),
  })
  await handleResponseError(res)

  let fullText = ''
  await readSSEStream(res, (data) => {
    try {
      const parsed = JSON.parse(data)
      const content = parsed.choices?.[0]?.delta?.content ?? parsed.choices?.[0]?.text ?? ''
      if (content) {
        fullText += content
        onChunk(content)
      }
    } catch { /* ignore parse errors for incomplete chunks */ }
  })
  return fullText
}

async function callAnthropicStream(
  apiKey: string, model: string, system: string, user: string, onChunk: (text: string) => void,
): Promise<string> {
  const res = await fetchWithTimeout(API_URLS.anthropic, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model, system, messages: [{ role: 'user', content: user }], max_tokens: 1024, stream: true }),
  })
  await handleResponseError(res)

  let fullText = ''
  await readSSEStream(res, (data) => {
    try {
      const parsed = JSON.parse(data)
      const content = parsed.delta?.text ?? parsed.content_block?.delta?.text ?? ''
      if (content) {
        fullText += content
        onChunk(content)
      }
    } catch { /* ignore */ }
  })
  return fullText
}

async function callGroqStream(
  apiKey: string, model: string, system: string, user: string, onChunk: (text: string) => void,
): Promise<string> {
  const res = await fetchWithTimeout(API_URLS.groq, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      stream: true,
    }),
  })
  await handleResponseError(res)

  let fullText = ''
  await readSSEStream(res, (data) => {
    try {
      const parsed = JSON.parse(data)
      const content = parsed.choices?.[0]?.delta?.content ?? parsed.choices?.[0]?.text ?? ''
      if (content) {
        fullText += content
        onChunk(content)
      }
    } catch { /* ignore */ }
  })
  return fullText
}

async function callGoogleStream(
  apiKey: string, model: string, system: string, user: string, onChunk: (text: string) => void,
): Promise<string> {
  const url = `${API_URLS.google}/${model}:generateContent?key=${apiKey}`
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: `${system}\n\n${user}` }] }] }),
  })
  await handleResponseError(res)

  let fullText = ''
  await readSSEStream(res, (data) => {
    try {
      const parsed = JSON.parse(data)
      const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
      if (content) {
        fullText += content
        onChunk(content)
      }
    } catch { /* ignore */ }
  })
  return fullText
}

const PROVIDER_STREAMERS: Record<AIProvider, (key: string, model: string, system: string, user: string, onChunk: (text: string) => void) => Promise<string>> = {
  openai: callOpenAIStream,
  anthropic: callAnthropicStream,
  groq: callGroqStream,
  google: callGoogleStream,
}

export async function callAIStream(
  provider: AIProvider,
  apiKey: string,
  model: string,
  system: string,
  user: string,
  onChunk: (text: string) => void,
): Promise<string> {
  const streamer = PROVIDER_STREAMERS[provider]
  return streamer(apiKey, model, system, user, onChunk)
}

export function bridgePrompt(textA: string, textB: string) {
  return {
    system: 'Você é um assistente de escrita. Gere um parágrafo de transição fluida entre os dois textos fornecidos. Mantenha o tom e o estilo. Responda apenas com o texto de transição, sem introduções ou formatação.',
    user: `Texto A:\n${textA}\n\nTexto B:\n${textB}`,
  }
}

export function correctPrompt(text: string) {
  return {
    system: 'Você é um revisor de texto. Corrija erros ortográficos, gramaticais e de pontuação no texto fornecido. Preserve o tom e o estilo original. Responda apenas com o texto corrigido.',
    user: text,
  }
}

export function rewritePrompt(text: string, instruction: string) {
  return {
    system: `Você é um assistente de escrita. Reescreva o texto fornecido seguindo esta instrução: ${instruction}. Responda apenas com o texto reescrito.`,
    user: text,
  }
}
