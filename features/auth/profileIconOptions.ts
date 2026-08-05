export const PROFILE_ICON_OPTIONS = [
  { key: 'rocket', label: 'Rocket', code: '[VNG]' },
  { key: 'target', label: 'Target', code: '[TGT]' },
  { key: 'lightning', label: 'Lightning', code: '[ZAP]' },
  { key: 'crystalBall', label: 'Crystal Ball', code: '[ORC]' },
  { key: 'shield', label: 'Shield', code: '[SHD]' },
  { key: 'crown', label: 'Crown', code: '[CRN]' },
  { key: 'fire', label: 'Fire', code: '[PYR]' },
  { key: 'sword', label: 'Sword', code: '[BLD]' },
  { key: 'star', label: 'Star', code: '[STR]' },
  { key: 'robot', label: 'Robot', code: '[CYB]' },
] as const

export type ProfileIconKey = (typeof PROFILE_ICON_OPTIONS)[number]['key']

export const DEFAULT_PROFILE_ICON_KEY: ProfileIconKey = 'target'
