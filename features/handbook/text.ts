/**
 * Field-note titles, tags, and headings were authored with emoji as decoration
 * (a dragon before "Guild Lore"). The handbook draws its marks as icons, and a
 * colour emoji glyph clashes with them and is announced unpredictably by screen
 * readers, so display text drops them. The stored content is left as authored.
 */
const EMOJI = /[\p{Extended_Pictographic}\p{Emoji_Modifier}‍️]+/gu

export function stripEmoji(text: string): string {
  return text.replace(EMOJI, '').replace(/\s{2,}/g, ' ').trim()
}
