import type { RoomKey } from './room-map-data'

export type RoomPath =
  | '/app'
  | '/app/keywords'
  | '/app/runs'
  | '/app/guild'
  | '/app/keys'
  | '/app/billing'
  | '/app/deliveries'
  | '/app/profile'
  | '/app/settings'

export type RoomRouteMeta = {
  key: RoomKey
  icon: string
  title: string
  subtitle: string
  path: RoomPath
}

export const ROOM_ROUTE_META: RoomRouteMeta[] = [
  { key: 'guild-hall', icon: '🏰', title: 'Guild Hall', subtitle: 'Command board, mana flow, and active pressure', path: '/app' },
  { key: 'quest-board', icon: '📜', title: 'Quest Board', subtitle: 'Tracked keywords and live scan objectives', path: '/app/keywords' },
  { key: 'war-room', icon: '🛡', title: 'War Room', subtitle: 'Lead review, delivery status, and action routing', path: '/app/runs' },
  { key: 'mage-tower', icon: '🧙', title: 'Mage Tower', subtitle: 'Models, agents, and AI coordination', path: '/app/profile' },
  { key: 'treasury', icon: '💰', title: 'Treasury', subtitle: 'Billing, mana purchases, and plan state', path: '/app/billing' },
  { key: 'archive', icon: '📦', title: 'Archive', subtitle: 'History, keys, settings, and past work', path: '/app/settings' },
]

export const roomRouteMetaByPath = Object.fromEntries(
  ROOM_ROUTE_META.map((room) => [room.path, room]),
) as Record<RoomPath, RoomRouteMeta>
