import {
  Castle,
  LayoutDashboard,
  History,
  Scroll,
  Send,
  UserCircle,
  Swords,
  CreditCard,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import type { IconName } from '@/features/handbook/artifact/IconSprite'

export interface NavigationItem {
  label: string
  href: string
  icon: LucideIcon
  /** Painted emblem from the landing page's icon sprite, used by the rail. */
  emblem: IconName
  section: 'tactical' | 'guild' | 'system'
  color?: string
  badge?: string
  description?: string
}

export const navigation: NavigationItem[] = [
  {
    label: 'LIVING HQ',
    href: '/app',
    emblem: 'map',
    icon: LayoutDashboard,
    section: 'tactical',
    color: 'bg-emerald-400',
    description: 'Core command dashboard and battlefield overview.',
  },
  {
    label: 'QUEST BOARD',
    href: '/app/quests',
    emblem: 'scroll',
    icon: Scroll,
    section: 'tactical',
    color: 'bg-yellow-400',
    // No badge. The one that used to sit here was the literal string '12' on
    // every account, which is worse than no count at all.
    description: 'Active quests, progress, and rewards waiting to be claimed.',
  },
  {
    label: 'SCAN RUNS',
    href: '/app/runs',
    emblem: 'spyglass',
    icon: History,
    section: 'tactical',
    color: 'bg-lime-400',
    description: 'Durable ledger of every scan this account has queued.',
  },
  {
    label: 'QUEST LOG',
    href: '/app/keywords',
    emblem: 'flag',
    icon: Swords,
    section: 'tactical',
    color: 'bg-orange-400',
    // No badge: '0/3' was a literal on every account, not a count.
    description: 'Daily objectives, streaks, and keyword quests.',
  },
  {
    label: 'GUILD HALL',
    href: '/app/guild',
    emblem: 'crown',
    icon: Castle,
    section: 'guild',
    color: 'bg-cyan-400',
    description: 'Guild activity, wins, and community rewards.',
  },
  {
    label: 'CAMPAIGN BROADCAST',
    href: '/app/deliveries',
    emblem: 'lighthouse',
    icon: Send,
    section: 'guild',
    color: 'bg-sky-400',
    description: 'Outbound campaigns, deliveries, and broadcast ops.',
  },
  {
    label: 'KNOWLEDGE LORE',
    href: '/app/profile',
    emblem: 'medal',
    icon: UserCircle,
    section: 'system',
    color: 'bg-rose-400',
    description: 'Saved knowledge, profile, and account identity.',
  },
  {
    label: 'BAZAAR & SUPPLIES',
    href: '/app/billing',
    emblem: 'chest',
    icon: CreditCard,
    section: 'system',
    color: 'bg-amber-400',
    description: 'Mana balance, billing, and account controls.',
  },
  {
    label: 'ARMORY & SPELLS',
    href: '/app/settings',
    emblem: 'sword',
    icon: Settings,
    section: 'system',
    color: 'bg-purple-400',
    description: 'Preferences, system options, and app settings.',
  },
]
