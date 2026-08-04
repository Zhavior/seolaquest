import {
  LayoutDashboard,
  History,
  Send,
  UserCircle,
  Swords,
  Key,
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
  { label: 'Battlestation',  href: '/app',           icon: LayoutDashboard },
  { label: 'Scan Runs',      href: '/app/runs',       icon: History         },
  { label: 'CRM Deliveries', href: '/app/deliveries', icon: Send            },
  { label: 'Profile Feed',   href: '/app/profile',    icon: UserCircle      },
  { label: 'Guild Hall',     href: '/app/guild',      icon: Swords          },
  { label: 'API Keys',       href: '/app/keys',       icon: Key             },
  { label: 'Billing',        href: '/app/billing',    icon: CreditCard      },
  { label: 'Settings',       href: '/app/settings',   icon: Settings        },
]
