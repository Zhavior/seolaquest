import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { getServerEnv } from './env'

/** Short, frequent jobs where cost per call matters: classifying posts, drafting lead replies. */
export const CLAUDE_FAST_MODEL = 'claude-haiku-5-5'

/** Longer writing, chat, and GEO scans, which need web search that Haiku's tool version lacks. */
export const CLAUDE_SMART_MODEL = 'claude-sonnet-5-5'

/**
 * Lets the API re-run a declined request on another model inside the same call,
 * so a safety decline does not reach the user as an empty answer. Sonnet only:
 * Haiku has no server-side fallback. GEO scans leave this off on purpose,
 * because a scan has to measure the engine it names.
 */
export const CLAUDE_REFUSAL_FALLBACK = {
  betas: ['server-side-fallback-2026-07-01'],
  fallbacks: 'default' as const,
}

/** Unconfigured means unavailable: callers answer "not configured" rather than guess. */
export function getClaudeClient(): Anthropic | null {
  const { ANTHROPIC_API_KEY } = getServerEnv()
  return ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null
}

/** The answer text of a response. Empty when the model declined, so callers treat it as no answer. */
export function claudeText(message: {
  stop_reason?: string | null
  content: ReadonlyArray<{ type: string; text?: string }>
}): string {
  if (message.stop_reason === 'refusal') return ''
  return message.content
    .flatMap((block) => (block.type === 'text' && block.text ? [block.text] : []))
    .join('')
    .trim()
}
