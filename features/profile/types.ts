import type { LucideIcon } from 'lucide-react'

export type ProfilePost = {
  id: string
  content: string
  createdAt: string
}

export type QuestItem = {
  id: number | string
  title: string
  xp: number
  dueDate: string
  completed: boolean
  priority: 'HIGH' | 'MED' | 'LOW'
}

export type InventorySlot = {
  id: number
  name: string
  icon: LucideIcon | null
  color: string
  rarity: 'LEGENDARY' | 'EPIC' | 'RARE' | 'COMMON' | 'EMPTY'
  stat: string
}
