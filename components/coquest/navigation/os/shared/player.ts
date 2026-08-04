export interface PlayerState {
  name: string
  xp: number
  title: string
  activeQuest: string
  questProgress: number
}

export const player: PlayerState = {
  name: 'Boyd',
  xp: 1820,
  title: 'Apprentice Builder',
  activeQuest: 'Launch Public Beta',
  questProgress: 73,
}
