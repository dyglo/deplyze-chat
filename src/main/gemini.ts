import { GoogleGenAI } from '@google/genai'
import { app } from 'electron'
import { existsSync, readFileSync } from 'fs'
import { dirname, join, resolve } from 'path'

let envLoaded = false

function loadDotEnv(): void {
  if (envLoaded) return
  envLoaded = true

  const candidates = new Set<string>()
  candidates.add(resolve(process.cwd(), '.env'))

  try {
    const appPath = app.getAppPath()
    let dir = appPath
    for (let i = 0; i < 4; i++) {
      candidates.add(join(dir, '.env'))
      const parent = dirname(dir)
      if (parent === dir) break
      dir = parent
    }
  } catch {
    // Ignore app path lookup issues and fall back to process.cwd().
  }

  for (const file of candidates) {
    if (!existsSync(file)) continue
    const text = readFileSync(file, 'utf-8')
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
      if (!match) continue
      const [, key, rawValue] = match
      if (process.env[key]) continue
      let value = rawValue.trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      process.env[key] = value
    }
    break
  }
}

function getApiKey(): string | null {
  loadDotEnv()
  const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY
  const trimmed = key?.trim()
  return trimmed ? trimmed : null
}

let client: GoogleGenAI | null = null

function getClient(): GoogleGenAI {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error(
      'Missing Gemini API key. Set GEMINI_API_KEY or GOOGLE_API_KEY before launching the app.'
    )
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey })
  }
  return client
}

export function hasGeminiApiKey(): boolean {
  return !!getApiKey()
}

export async function validateGeminiConfig(model: string): Promise<void> {
  const ai = getClient()
  await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
    config: {
      maxOutputTokens: 1,
      temperature: 0
    }
  })
}

export async function listAvailableModels(): Promise<string[]> {
  return ['gemini-3-flash-preview']
}

export interface GeminiChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
}

export interface GeminiChatOptions {
  model: string
  messages: GeminiChatMessage[]
  signal?: AbortSignal
  temperature?: number
}

export async function* chatStream(
  opts: GeminiChatOptions
): AsyncGenerator<{ content?: string; done?: boolean }> {
  const ai = getClient()
  const systemInstruction = opts.messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content.trim())
    .filter(Boolean)
    .join('\n\n')

  const contents = opts.messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [
        {
          text: m.role === 'tool' ? `Tool result:\n${m.content}` : m.content
        }
      ]
    }))

  const response = await ai.models.generateContentStream({
    model: opts.model,
    contents,
    config: {
      abortSignal: opts.signal,
      systemInstruction,
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: 8192
    }
  })

  for await (const chunk of response) {
    const text = typeof chunk.text === 'string' ? chunk.text : ''
    if (text) {
      yield { content: text }
    }
  }

  yield { done: true }
}
