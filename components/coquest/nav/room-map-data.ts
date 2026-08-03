export const ROOM_KEYS = [
  'guild-hall',
  'quest-board',
  'war-room',
  'mage-tower',
  'treasury',
  'archive',
] as const

export type RoomKey = (typeof ROOM_KEYS)[number]

export const ROOM_MAP: Array<{
  key: RoomKey
  icon: string
  label: string
  href: string
}> = [
  { key: 'guild-hall', icon: '🏰', label: 'Guild Hall', href: '/app' },
  { key: 'quest-board', icon: '📜', label: 'Quest Board', href: '/app/keywords' },
  { key: 'war-room', icon: '🛡', label: 'War Room', href: '/app/runs' },
  { key: 'mage-tower', icon: '🧙', label: 'Mage Tower', href: '/app/profile' },
  { key: 'treasury', icon: '💰', label: 'Treasury', href: '/app/billing' },
  { key: 'archive', icon: '📦', label: 'Archive', href: '/app/settings' },
]
