import { describe, it, expect, vi, beforeEach } from 'vitest'
import { callAI, callAIStream, bridgePrompt, correctPrompt, rewritePrompt, AIError } from './ai'

function mockFetch(data: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  })
}

describe('bridgePrompt', () => {
  it('returns system and user messages', () => {
    const result = bridgePrompt('Hello', 'World')
    expect(result.system).toContain('transição')
    expect(result.user).toContain('Hello')
  })
})

describe('correctPrompt', () => {
  it('returns system and user messages', () => {
    const result = correctPrompt('Some text with eror')
    expect(result.system).toContain('Corrija')
    expect(result.user).toBe('Some text with eror')
  })
})

describe('rewritePrompt', () => {
  it('includes instruction in system prompt', () => {
    const result = rewritePrompt('Text', 'make it formal')
    expect(result.system).toContain('make it formal')
    expect(result.user).toBe('Text')
  })
})

describe('callAI', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('calls OpenAI and returns content', async () => {
    globalThis.fetch = mockFetch({ choices: [{ message: { content: 'Hello' } }] })
    const result = await callAI('openai', 'sk-test', 'gpt-4o-mini', 'system', 'user')
    expect(result).toBe('Hello')
    expect(fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer sk-test' }),
      }),
    )
  })

  it('calls Anthropic and returns content', async () => {
    globalThis.fetch = mockFetch({ content: [{ text: 'Hello' }] })
    const result = await callAI('anthropic', 'sk-test', 'claude-3-haiku-20240307', 'system', 'user')
    expect(result).toBe('Hello')
  })

  it('calls Groq and returns content', async () => {
    globalThis.fetch = mockFetch({ choices: [{ message: { content: 'Hello' } }] })
    const result = await callAI('groq', 'gsk-test', 'llama-3.3-70b-versatile', 'system', 'user')
    expect(result).toBe('Hello')
  })

  it('calls Google and returns content', async () => {
    globalThis.fetch = mockFetch({ candidates: [{ content: { parts: [{ text: 'Hello' }] } }] })
    const result = await callAI('google', 'ai-test', 'gemini-1.5-flash', 'system', 'user')
    expect(result).toBe('Hello')
  })

  it('throws AIError with code "auth" on 401', async () => {
    globalThis.fetch = mockFetch({ error: 'unauthorized' }, 401)
    const err = await callAI('openai', 'bad-key', 'gpt-4o-mini', 'system', 'user').catch((e) => e)
    expect(err).toBeInstanceOf(AIError)
    expect(err.code).toBe('auth')
  })

  it('throws AIError with code "rate_limit" on 429', async () => {
    globalThis.fetch = mockFetch({ error: 'rate limited' }, 429)
    const err = await callAI('openai', 'sk-test', 'gpt-4o-mini', 'system', 'user').catch((e) => e)
    expect(err).toBeInstanceOf(AIError)
    expect(err.code).toBe('rate_limit')
  })

  it('throws AIError with code "server_error" on 503', async () => {
    globalThis.fetch = mockFetch({ error: 'service unavailable' }, 503)
    const err = await callAI('openai', 'sk-test', 'gpt-4o-mini', 'system', 'user').catch((e) => e)
    expect(err).toBeInstanceOf(AIError)
    expect(err.code).toBe('server_error')
  })

  it('throws AIError with code "network" on fetch rejection', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'))
    const err = await callAI('openai', 'sk-test', 'gpt-4o-mini', 'system', 'user').catch((e) => e)
    expect(err).toBeInstanceOf(AIError)
    expect(err.code).toBe('network')
  })
})

describe('callAIStream', () => {
  function mockSSEStream(chunks: string[]) {
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk))
        }
        controller.close()
      },
    })
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: stream,
    })
  }

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('streams OpenAI response chunk by chunk', async () => {
    mockSSEStream([
      'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":" world"}}]}\n\n',
      'data: [DONE]\n\n',
    ])

    const chunks: string[] = []
    const result = await callAIStream('openai', 'sk-test', 'gpt-4o-mini', 'system', 'user', (c) => chunks.push(c))

    expect(chunks).toEqual(['Hello', ' world'])
    expect(result).toBe('Hello world')
  })

  it('streams Anthropic response chunk by chunk', async () => {
    mockSSEStream([
      'data: {"type":"content_block_delta","delta":{"text":"Hello"}}\n\n',
      'data: {"type":"content_block_delta","delta":{"text":" world"}}\n\n',
    ])

    const chunks: string[] = []
    const result = await callAIStream('anthropic', 'sk-test', 'claude-3-haiku-20240307', 'system', 'user', (c) => chunks.push(c))

    expect(chunks).toEqual(['Hello', ' world'])
    expect(result).toBe('Hello world')
  })

  it('streams Groq response chunk by chunk', async () => {
    mockSSEStream([
      'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
      'data: [DONE]\n\n',
    ])

    const chunks: string[] = []
    const result = await callAIStream('groq', 'gsk-test', 'llama-3.3-70b-versatile', 'system', 'user', (c) => chunks.push(c))

    expect(chunks).toEqual(['Hello'])
    expect(result).toBe('Hello')
  })

  it('streams Google response chunk by chunk', async () => {
    mockSSEStream([
      'data: {"candidates":[{"content":{"parts":[{"text":"Hello"}]}}]}\n\n',
      'data: {"candidates":[{"content":{"parts":[{"text":" world"}]}}]}\n\n',
    ])

    const chunks: string[] = []
    const result = await callAIStream('google', 'ai-test', 'gemini-1.5-flash', 'system', 'user', (c) => chunks.push(c))

    expect(chunks).toEqual(['Hello', ' world'])
    expect(result).toBe('Hello world')
  })

  it('propagates AIError on auth failure', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'unauthorized' }),
    })

    const err = await callAIStream('openai', 'bad-key', 'gpt-4o-mini', 'system', 'user', vi.fn()).catch((e) => e)
    expect(err).toBeInstanceOf(AIError)
    expect(err.code).toBe('auth')
  })
})
