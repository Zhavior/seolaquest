'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser, SignOutButton } from '@clerk/nextjs'
import { CreditCard, Key, LayoutDashboard, LogOut, Menu, Settings, UserCircle, X, Zap } from 'lucide-react'

const publicPaths = new Set(['/landing', '/login', '/onboarding'])

export function Sidebar() {
  const pathname = usePathname()
  const { user, isLoaded } = useUser()
  const [isOpen, setIsOpen] = useState(false)

  if (publicPaths.has(pathname)) return null
  if (isLoaded && !user && process.env.NODE_ENV !== 'development') return null

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Profile Feed', href: '/profile', icon: UserCircle },
    { name: 'API Keys', href: '/keys', icon: Key },
    { name: 'Billing', href: '/billing', icon: CreditCard },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]
  
  const displayName = user?.fullName || user?.primaryEmailAddress?.emailAddress || 'Hunter'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center justify-between border-b-4 border-black bg-[#FFE600] px-4 md:hidden">
        <div className="flex items-center gap-2 font-black uppercase"><Zap className="fill-white text-white" /> HypeQuest</div>
        <button type="button" onClick={() => setIsOpen(true)} className="border-2 border-black bg-white p-2"><Menu /></button>
      </div>
      {isOpen && <button type="button" aria-label="Close menu overlay" onClick={() => setIsOpen(false)} className="fixed inset-0 z-40 bg-black/50 md:hidden" />}
      <aside className={`fixed left-0 top-0 z-50 flex h-[100dvh] w-64 flex-col border-r-4 border-black bg-white transition-transform md:sticky md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between border-b-4 border-black bg-[#FFE600] px-4 font-black uppercase text-2xl"><span className="flex items-center gap-2"><Zap className="fill-white text-white" /> HypeQuest</span><button type="button" onClick={() => setIsOpen(false)} className="border-2 border-black bg-white p-1 md:hidden"><X size={18} /></button></div>
        <nav className="flex-1 space-y-2 p-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} className={`flex items-center gap-3 border-2 px-3 py-3 font-bold uppercase ${active ? 'border-black bg-black text-white' : 'border-transparent text-gray-700 hover:border-black hover:bg-gray-50'}`}><Icon size={19} />{item.name}</Link>
          })}
        </nav>
        <div className="border-t-4 border-black p-4">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center border-2 border-black bg-[#06B6D4] font-black">{initials}</span>
            <div>
              <p className="max-w-40 truncate font-bold">{displayName}</p>
              <p className="text-xs font-bold uppercase text-gray-500">Signed in</p>
            </div>
          </div>
          <SignOutButton redirectUrl="/landing">
            <button type="button" className="flex w-full items-center justify-center gap-2 border-2 border-black bg-[#FF5722] p-3 font-black uppercase text-white shadow-[2px_2px_0_0_#000]"><LogOut size={16} /> Log out</button>
          </SignOutButton>
        </div>
      </aside>
    </>
  )
}
