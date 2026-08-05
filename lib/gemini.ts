import 'server-only'
import { GoogleGenAI } from '@google/genai'
import { getServerEnv } from './env'

export function getGeminiClient(): GoogleGenAI | null {
  const env = getServerEnv()
  if (!env.GEMINI_API_KEY) {
    return null
  }
  return new GoogleGenAI({ apiKey: env.GEMINI_API_KEY })
}
