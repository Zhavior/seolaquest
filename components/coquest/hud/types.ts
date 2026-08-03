export type GuildHudProvider = {
  name: string
  status: 'active' | 'warning' | 'inactive'
}

export type GuildHudData = {
  avatarLabel: string
  playerName: string
  level: number
  className: string
  mana: number
  manaMax: number
  planName: string
  providers: GuildHudProvider[]
}
