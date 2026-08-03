export const PROFILE_ICON_OPTIONS = [
  { key: 'rocket', emoji: '🚀', label: 'Rocket' },
  { key: 'target', emoji: '🎯', label: 'Target' },
  { key: 'lightning', emoji: '⚡', label: 'Lightning' },
  { key: 'crystalBall', emoji: '🔮', label: 'Crystal Ball' },
  { key: 'shield', emoji: '🛡️', label: 'Shield' },
  { key: 'crown', emoji: '👑', label: 'Crown' },
  { key: 'fire', emoji: '🔥', label: 'Fire' },
  { key: 'sword', emoji: '⚔️', label: 'Sword' },
  { key: 'star', emoji: '⭐', label: 'Star' },
  { key: 'robot', emoji: '🤖', label: 'Robot' },
] as const

export type ProfileIconKey = (typeof PROFILE_ICON_OPTIONS)[number]['key']

export const DEFAULT_PROFILE_ICON_KEY: ProfileIconKey = 'target'
