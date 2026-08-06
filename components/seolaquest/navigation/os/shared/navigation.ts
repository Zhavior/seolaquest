import {
  Castle,
  LayoutDashboard,
  History,
  Send,
  UserCircle,
  Swords,
  CreditCard,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface NavigationItem {
  label: string
  href: string
  icon: LucideIcon
  section: 'tactical' | 'guild' | 'system'
  color?: string
  badge?: string
  hotkey?: string
  description?: string
}

export const navigation: NavigationItem[] = [
  {
    label: 'LIVING HQ',
    href: '/app',
    icon: LayoutDashboard,
    section: 'tactical',
    color: 'bg-emerald-400',
    hotkey: 'B',
    description: 'Core command dashboard and battlefield overview.',
  },
  {
    label: 'QUEST BOARD',
    href: '/app/runs',
    icon: History,
    section: 'tactical',
    color: 'bg-yellow-400',
    badge: '12',
    hotkey: 'S',
    description: 'Incoming signal queue and active hunt matches.',
  },
  {
    label: 'QUEST LOG',
    href: '/app/keywords',
    icon: Swords,
    section: 'tactical',
    color: 'bg-orange-400',
    badge: '0/3',
    hotkey: 'Q',
    description: 'Daily objectives, streaks, and keyword quests.',
  },
  {
    label: 'GUILD HALL',
    href: '/app/guild',
    icon: Castle,
    section: 'guild',
    color: 'bg-cyan-400',
    hotkey: 'G',
    description: 'Guild activity, wins, and community rewards.',
  },
  {
    label: 'CAMPAIGN BROADCAST',
    href: '/app/deliveries',
    icon: Send,
    section: 'guild',
    color: 'bg-sky-400',
    hotkey: 'C',
    description: 'Outbound campaigns, deliveries, and broadcast ops.',
  },
  {
    label: 'KNOWLEDGE LORE',
    href: '/app/profile',
    icon: UserCircle,
    section: 'system',
    color: 'bg-rose-400',
    hotkey: 'L',
    description: 'Saved knowledge, profile, and account identity.',
  },
  {
    label: 'BAZAAR & SUPPLIES',
    href: '/app/billing',
    icon: CreditCard,
    section: 'system',
    color: 'bg-amber-400',
    hotkey: 'M',
    description: 'Mana balance, billing, and account controls.',
  },
  {
    label: 'ARMORY & SPELLS',
    href: '/app/settings',
    icon: Settings,
    section: 'system',
    color: 'bg-purple-400',
    hotkey: 'K',
    description: 'Preferences, system options, and app settings.',
  },
]
