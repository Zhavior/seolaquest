export type RuneScope = 'scouts:read' | 'strikes:write' | 'mana:consume'

export interface ApiRune {
  id: string
  label: string
  keyPrefix: string
  keyHash: string
  rawKey?: string // populated only once when newly minted
  scopes: RuneScope[]
  status: 'ACTIVE' | 'REVOKED'
  createdAt: string
  lastActive: string
  dailyQuotaMp: number // e.g. 1000 MP
  usedQuotaMp: number // e.g. 340 MP
}

export interface ScopeDefinition {
  id: RuneScope
  name: string
  icon: string
  description: string
  badgeColor: string
}

export const RUNE_SCOPES: ScopeDefinition[] = [
  {
    id: 'scouts:read',
    name: 'READ_BOUNTIES',
    icon: '🛡️',
    description: 'Reserved scope; public API access is unavailable',
    badgeColor: 'bg-emerald-400 text-black border-black',
  },
  {
    id: 'strikes:write',
    name: 'EXECUTE_STRIKE',
    icon: '⚔️',
    description: 'Reserved scope; write access is unavailable',
    badgeColor: 'bg-amber-400 text-black border-black',
  },
  {
    id: 'mana:consume',
    name: 'CONSUME_MANA',
    icon: '🧪',
    description: 'Reserved scope; programmatic credit use is unavailable',
    badgeColor: 'bg-purple-400 text-black border-black',
  },
]
