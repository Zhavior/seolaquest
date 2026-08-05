export interface PlayerState {
  name: string
  xp: number
  title: string
  activeQuestId: string
}

export const player: PlayerState = {
  name: 'Boyd',
  xp: 1820,
  title: 'Apprentice Builder',
  activeQuestId: 'launch-beta',
}
