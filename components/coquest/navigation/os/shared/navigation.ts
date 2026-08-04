import {
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
}

export const navigation: NavigationItem[] = [
  { label: 'Battlestation', href: '/app', icon: LayoutDashboard },
  { label: 'Guild Hall', href: '/app/guild', icon: LayoutDashboard },
  { label: 'Scan Runs', href: '/app/runs', icon: History },
  { label: 'Deliveries', href: '/app/deliveries', icon: Send },
  { label: 'Keywords', href: '/app/keywords', icon: Swords },
  { label: 'Billing', href: '/app/billing', icon: CreditCard },
  { label: 'Profile', href: '/app/profile', icon: UserCircle },
  { label: 'Settings', href: '/app/settings', icon: Settings },
]
