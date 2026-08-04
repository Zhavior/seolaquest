export interface Quest {
  id: string
  title: string
  description: string
  progress: number
  xpReward: number
  completed: boolean
}

export const quests: Quest[] = [
  {
    id: 'launch-beta',
    title: 'Launch Public Beta',
    description: 'Prepare CoQuest for its first public release.',
    progress: 73,
    xpReward: 500,
    completed: false,
  },
  {
    id: 'connect-stripe',
    title: 'Connect Stripe',
    description: 'Enable billing for your realm.',
    progress: 100,
    xpReward: 250,
    completed: true,
  },
]
