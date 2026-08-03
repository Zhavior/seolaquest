export type GuildHudProvider = {
  name: string
  status: 'active' | 'warning' | 'inactive'
}

export type GuildHudData = {
  avatarLabel: string
  playerName: string
  /** kept for character sheet — NOT rendered in the persistent HUD */
  level: number
  className: string
  mana: number
  manaMax: number
  planName: string
  providers: GuildHudProvider[]
  /** e.g. "Silver ⚔" — compact insignia shown in HUD */
  guildRank: string
  /** online | away | offline */
  onlineStatus: 'online' | 'away' | 'offline'
  /** count of in-progress keyword scans */
  activeQuests: number
}
