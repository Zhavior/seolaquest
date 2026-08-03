import type { GuildHudData, GuildHudProvider } from './types'

type CurrentUserLike = {
  email: string
  name: string | null
  title?: string | null
  level?: number | null
  mana?: number | null
  manaMax?: number | null
  plan?: string | null
}

function pickString(value: string | null | undefined, fallback: string) {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback
}

function pickNumber(value: number | null | undefined, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function buildProviders(): GuildHudProvider[] {
  return [
    { name: 'Reddit', status: 'active' },
    { name: 'X', status: 'warning' },
    { name: 'LinkedIn', status: 'inactive' },
  ]
}

export function buildGuildHudData(user: CurrentUserLike): GuildHudData {
  const playerName =
    (typeof user.name === 'string' && user.name.trim().length > 0 ? user.name.trim() : null) ??
    user.email.split('@')[0] ??
    'Guild Master'

  const manaMax = pickNumber(user.manaMax, 100)
  const mana = Math.max(0, Math.min(pickNumber(user.mana, 84), manaMax))

  return {
    avatarLabel: playerName.slice(0, 2).toUpperCase(),
    playerName,
    level: pickNumber(user.level, 12),
    className: pickString(user.title, 'Lead Alchemist'),
    mana,
    manaMax,
    planName: pickString(user.plan, 'Legend'),
    providers: buildProviders(),
  }
}
