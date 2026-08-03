'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignOutButton, useUser } from '@clerk/nextjs'
import {
  ChevronRight,
  CreditCard,
  ExternalLink,
  History,
  Key,
  LayoutDashboard,
  LogOut,
  Menu,
  Pencil,
  Send,
  Settings,
  Swords,
  UserCircle,
  X,
  Zap,
} from 'lucide-react'

const publicPaths = new Set(['/landing', '/login', '/onboarding'])
const mobileDialogId = 'mobile-navigation-dialog'
const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

const navItems = [
  { name: 'Dashboard', href: '/app', icon: LayoutDashboard, color: 'text-blue-500' },
  { name: 'Scan Runs', href: '/app/runs', icon: History, color: 'text-cyan-600' },
  { name: 'CRM Deliveries', href: '/app/deliveries', icon: Send, color: 'text-emerald-600' },
  { name: 'Profile Feed', href: '/app/profile', icon: UserCircle, color: 'text-green-500' },
  { name: 'Guild Hall', href: '/app/guild', icon: Swords, color: 'text-purple-500' },
  { name: 'API Keys', href: '/app/keys', icon: Key, color: 'text-orange-500' },
  { name: 'Billing', href: '/app/billing', icon: CreditCard, color: 'text-pink-500' },
  { name: 'Settings', href: '/app/settings', icon: Settings, color: 'text-zinc-500' },
]

type SidebarPanelProps = {
  closeButtonRef?: RefObject<HTMLButtonElement | null>
  displayName: string
  initials: string
  mobile?: boolean
  onClose?: () => void
  onRouteSelection?: () => void
  pathname: string
}

function SidebarPanel({
  closeButtonRef,
  displayName,
  initials,
  mobile = false,
  onClose,
  onRouteSelection,
  pathname,
}: SidebarPanelProps) {
  return (
    <>
      <div className="flex h-[calc(4rem+env(safe-area-inset-top))] shrink-0 items-center justify-between border-b-4 border-black bg-[#FFE600] pl-[max(1rem,env(safe-area-inset-left))] pr-4 pt-[env(safe-area-inset-top)] font-black uppercase text-2xl">
        <span id={mobile ? 'mobile-navigation-title' : undefined} className="relative flex items-center gap-2">
          <Pencil className="pointer-events-none absolute -left-3 -top-1 h-9 w-9 -rotate-12 stroke-[3.5px] text-[#06B6D4] opacity-80" />
          <Zap className="relative z-10 fill-white text-white stroke-[2.5px]" />
          <span className="relative z-10">CoQuest</span>
        </span>
        {mobile && (
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close main navigation"
            onClick={onClose}
            className="flex min-h-11 min-w-11 items-center justify-center border-2 border-black bg-white shadow-[2px_2px_0_0_#000] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-black"
          >
            <X aria-hidden="true" size={20} />
          </button>
        )}
      </div>

      <nav
        aria-label={mobile ? 'Mobile main navigation' : 'Main navigation links'}
        className="flex-1 space-y-4 overflow-y-auto overscroll-contain bg-[#F4F4F5] p-5"
      >
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || (item.href !== '/app' && pathname.startsWith(`${item.href}/`))
          return (
            <Link
              key={item.href}
              href={item.href}
              onNavigate={mobile ? onRouteSelection : undefined}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-11 items-center justify-between border-4 px-4 py-3 font-black uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#06B6D4] ${
                active
                  ? 'border-black bg-black text-[#FFE600] shadow-[4px_4px_0_0_#FFE600]'
                  : 'border-black bg-white text-black shadow-[4px_4px_0_0_#000] hover:bg-zinc-100 focus-visible:bg-zinc-100'
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon aria-hidden="true" size={20} className={active ? 'text-[#FFE600]' : item.color} />
                {item.name}
              </span>
              {active && <ChevronRight aria-hidden="true" size={20} className="text-[#FFE600]" />}
            </Link>
          )
        })}
      </nav>

      <div className="flex shrink-0 flex-col gap-4 border-t-4 border-black bg-zinc-100 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="relative border-4 border-black bg-white p-3 shadow-[4px_4px_0_0_#000]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-black bg-[#A855F7] text-xl font-black text-white shadow-[2px_2px_0_0_#000]">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black uppercase">{displayName}</p>
              <p className="text-[10px] font-bold uppercase text-zinc-500">Authenticated Clerk identity</p>
            </div>
          </div>
        </div>

        <Link
          href="/blog"
          target="_blank"
          rel="noopener noreferrer"
          onClick={mobile ? onRouteSelection : undefined}
          className="flex min-h-11 items-center justify-between border-3 border-black bg-white px-3 py-2 text-xs font-black uppercase text-black shadow-[3px_3px_0_0_#000] transition-all hover:bg-[#FFE600] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none focus-visible:bg-[#FFE600] focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#06B6D4]"
        >
          <span className="flex items-center gap-2">📜 Guild Knowledge Base</span>
          <ExternalLink aria-hidden="true" size={14} />
        </Link>

        <SignOutButton redirectUrl="/">
          <button
            type="button"
            onClick={mobile ? onRouteSelection : undefined}
            className="flex min-h-11 w-full items-center justify-center gap-2 border-4 border-black bg-[#FF5722] p-3 font-black uppercase text-white shadow-[4px_4px_0_0_#000] transition-all hover:bg-orange-600 active:translate-x-1 active:translate-y-1 active:shadow-none focus-visible:bg-orange-600 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-black"
          >
            <LogOut aria-hidden="true" size={18} strokeWidth={3} /> Log out
          </button>
        </SignOutButton>
      </div>
    </>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const { user, isLoaded } = useUser()
  const [openPathname, setOpenPathname] = useState<string | null>(null)
  const openerRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const dialogPanelRef = useRef<HTMLElement>(null)
  const mobileHeaderRef = useRef<HTMLDivElement>(null)
  const restoreFocusRef = useRef(true)
  const isOpen = openPathname === pathname

  useEffect(() => {
    if (!isOpen) return

    const panel = dialogPanelRef.current
    const opener = openerRef.current
    const main = document.querySelector<HTMLElement>('[data-authenticated-main]')
    const backgroundElements = [main, mobileHeaderRef.current].filter((element): element is HTMLElement => Boolean(element))
    const inertBeforeOpen = backgroundElements.map((element) => element.hasAttribute('inert'))
    const bodyOverflow = document.body.style.overflow
    const htmlOverflow = document.documentElement.style.overflow

    backgroundElements.forEach((element) => element.setAttribute('inert', ''))
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        restoreFocusRef.current = true
        setOpenPathname(null)
        return
      }

      if (event.key !== 'Tab' || !panel) return

      const focusableElements = Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector))
        .filter((element) => !element.hasAttribute('disabled'))
      const first = focusableElements[0]
      const last = focusableElements.at(-1)

      if (!first || !last) {
        event.preventDefault()
        panel.focus()
        return
      }

      if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = bodyOverflow
      document.documentElement.style.overflow = htmlOverflow
      backgroundElements.forEach((element, index) => {
        if (!inertBeforeOpen[index]) element.removeAttribute('inert')
      })
      if (restoreFocusRef.current) opener?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return

    const desktopQuery = window.matchMedia('(min-width: 1024px)')
    const closeAtDesktopWidth = () => {
      if (desktopQuery.matches) {
        restoreFocusRef.current = false
        setOpenPathname(null)
      }
    }

    desktopQuery.addEventListener('change', closeAtDesktopWidth)
    return () => desktopQuery.removeEventListener('change', closeAtDesktopWidth)
  }, [])

  if (publicPaths.has(pathname) || pathname.startsWith('/blog')) return null
  if (isLoaded && !user && process.env.NODE_ENV !== 'development') return null

  const displayName = user?.fullName || user?.primaryEmailAddress?.emailAddress || 'Hunter'
  const initials = displayName.slice(0, 2).toUpperCase()
  const openMenu = () => {
    restoreFocusRef.current = true
    setOpenPathname(pathname)
  }
  const closeMenu = () => {
    restoreFocusRef.current = true
    setOpenPathname(null)
  }
  const closeForRouteSelection = () => {
    restoreFocusRef.current = false
    setOpenPathname(null)
  }

  return (
    <>
      <div
        ref={mobileHeaderRef}
        className="fixed inset-x-0 top-0 z-40 flex h-[calc(4rem+env(safe-area-inset-top))] items-center justify-between border-b-4 border-black bg-[#FFE600] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[env(safe-area-inset-top)] lg:hidden"
      >
        <div className="relative flex items-center gap-2 text-xl font-black uppercase">
          <Pencil className="pointer-events-none absolute -left-2 -top-1 h-7 w-7 -rotate-12 stroke-[3px] text-[#06B6D4] opacity-80" />
          <Zap className="relative z-10 fill-white text-white" />
          <span className="relative z-10">CoQuest</span>
        </div>
        <button
          ref={openerRef}
          type="button"
          aria-label="Open main navigation"
          aria-expanded={isOpen}
          aria-controls={mobileDialogId}
          onClick={openMenu}
          className="flex min-h-11 min-w-11 items-center justify-center border-2 border-black bg-white shadow-[2px_2px_0_0_#000] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-black"
        >
          <Menu aria-hidden="true" />
        </button>
      </div>

      {isOpen && (
        <div
          id={mobileDialogId}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-navigation-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeMenu()
          }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
        >
          <aside
            ref={dialogPanelRef}
            tabIndex={-1}
            className="flex h-[100dvh] w-[min(18rem,100vw)] flex-col border-r-4 border-black bg-white shadow-2xl"
          >
            <SidebarPanel
              mobile
              pathname={pathname}
              displayName={displayName}
              initials={initials}
              closeButtonRef={closeButtonRef}
              onClose={closeMenu}
              onRouteSelection={closeForRouteSelection}
            />
          </aside>
        </div>
      )}

      <aside aria-label="Main navigation" className="hidden h-[100dvh] w-72 shrink-0 flex-col border-r-4 border-black bg-white lg:sticky lg:top-0 lg:flex">
        <SidebarPanel pathname={pathname} displayName={displayName} initials={initials} />
      </aside>
    </>
  )
}
