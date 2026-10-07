import { describe, expect, it } from 'vitest'
import { stripEmoji } from './text'

describe('stripEmoji', () => {
  it('removes leading and inline emoji and tidies spacing', () => {
    expect(stripEmoji('🐉 Guild Lore: The Chronicles')).toBe('Guild Lore: The Chronicles')
    expect(stripEmoji('The Rise 🛡️ of Hunters')).toBe('The Rise of Hunters')
    expect(stripEmoji('🏆 Guild Leaderboards & Level Up Mechanics')).toBe('Guild Leaderboards & Level Up Mechanics')
  })

  it('leaves ordinary text and symbols alone', () => {
    expect(stripEmoji('SEO Growth & Developer Playbooks')).toBe('SEO Growth & Developer Playbooks')
    expect(stripEmoji('7 loops → activation (+25 XP)')).toBe('7 loops → activation (+25 XP)')
  })
})
