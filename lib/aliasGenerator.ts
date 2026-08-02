const PREFIXES = [
  'Shadow', 'Cryptic', 'Silent', 'Neon', 'Arcane', 'Cyber',
  'Iron', 'Phantom', 'Rogue', 'Apex', 'Vortex', 'Storm',
  'Frost', 'Ember', 'Void', 'Astral', 'Mythic', 'Obsidian'
]

const CLASSES = [
  'Paladin', 'Archmage', 'Scout', 'Hunter', 'Assassin', 'Warlock',
  'Berserker', 'Sentinel', 'Templar', 'Sniper', 'Vanguard', 'Sorcerer',
  'Ranger', 'Blade', 'Shadow-Walker', 'Spellblade'
]

const CLASS_TITLES = [
  '[👑 DRAGON SLAYER]',
  '[🛡️ KNIGHT]',
  '[🔮 ARCHMAGE]',
  '[⚡ STORM SCOUT]',
  '[🗡️ NIGHT BLADE]',
  '[🛡️ IRON GUARD]',
  '[🔥 PYRO MAGE]',
  '[🌀 VOID HUNTER]',
  '[💎 APEX SLAYER]',
  '[🏹 HAWKEYE]'
]

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return Math.abs(hash)
}

/**
 * Generates a deterministic RPG alias based on user ID or seed string.
 * Example: "Shadow_Paladin_99"
 */
export function generateHunterAlias(seed: string): string {
  if (!seed) return 'Silent_Scout_00'
  const hash = hashString(seed)
  const prefix = PREFIXES[hash % PREFIXES.length]
  const cls = CLASSES[(hash >> 3) % CLASSES.length]
  const num = (hash % 90) + 10
  return `${prefix}_${cls}_${num}`
}

/**
 * Generates a deterministic RPG class title based on seed.
 */
export function generateHunterClassTitle(seed: string, rank?: number): string {
  if (rank === 1) return '[👑 DRAGON SLAYER]'
  if (rank === 2) return '[🛡️ KNIGHT]'
  if (rank === 3) return '[🔮 ARCHMAGE]'

  if (!seed) return '[🛡️ HUNTER]'
  const hash = hashString(seed)
  return CLASS_TITLES[hash % CLASS_TITLES.length]
}

/**
 * Redacts sensitive lead information like URLs, domain names, prospect names, and emails.
 */
export function redactGuildSecrets(text: string): string {
  if (!text) return '[REDACTED GUILD SECRETS 🔒]'
  
  // Replace URLs
  let redacted = text.replace(/https?:\/\/[^\s]+/gi, '[REDACTED GUILD SECRETS 🔒]')
  // Replace emails
  redacted = redacted.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, '[REDACTED GUILD SECRETS 🔒]')
  
  return redacted
}
