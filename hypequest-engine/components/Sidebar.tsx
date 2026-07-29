'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser, SignOutButton } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { 
  CreditCard, 
  Key, 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  Pencil, 
  Settings, 
  UserCircle, 
  X, 
  Zap, 
  Swords,
  ChevronRight,
  Shield
} from 'lucide-react'

const publicPaths = new Set(['/landing', '/login', '/onboarding'])

export function Sidebar() {
  const pathname = usePathname()
  const { user, isLoaded } = useUser()
  const [isOpen, setIsOpen] = useState(false)

  if (publicPaths.has(pathname)) return null
  if (isLoaded && !user && process.env.NODE_ENV !== 'development') return null

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, color: 'text-blue-500' },
    { name: 'Profile Feed', href: '/profile', icon: UserCircle, color: 'text-green-500' },
    { name: 'Guild Hall', href: '/guild', icon: Swords, color: 'text-purple-500' },
    { name: 'API Keys', href: '/keys', icon: Key, color: 'text-orange-500' },
    { name: 'Billing', href: '/billing', icon: CreditCard, color: 'text-pink-500' },
    { name: 'Settings', href: '/settings', icon: Settings, color: 'text-zinc-500' },
  ]
  
  const displayName = user?.fullName || user?.primaryEmailAddress?.emailAddress || 'Hunter'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center justify-between border-b-4 border-black bg-[#FFE600] px-4 md:hidden">
        <div className="relative flex items-center gap-2 font-black uppercase text-xl">
          <Pencil className="absolute -left-2 -top-1 w-7 h-7 text-[#06B6D4] stroke-[3px] -rotate-12 opacity-80 pointer-events-none" />
          <Zap className="fill-white text-white relative z-10" /> <span className="relative z-10">HypeQuest</span>
        </div>
        <button type="button" onClick={() => setIsOpen(true)} className="border-2 border-black bg-white p-2 shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
          <Menu />
        </button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <button 
          type="button" 
          aria-label="Close menu overlay" 
          onClick={() => setIsOpen(false)} 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" 
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-0 z-50 flex h-[100dvh] w-72 flex-col border-r-4 border-black bg-white transition-transform duration-300 md:sticky md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b-4 border-black bg-[#FFE600] px-4 font-black uppercase text-2xl">
          <span className="relative flex items-center gap-2">
            <Pencil className="absolute -left-3 -top-1 w-9 h-9 text-[#06B6D4] stroke-[3.5px] -rotate-12 opacity-80 pointer-events-none" />
            <Zap className="fill-white text-white relative z-10 stroke-[2.5px]" /> <span className="relative z-10">HypeQuest</span>
          </span>
          <button 
            type="button" 
            onClick={() => setIsOpen(false)} 
            className="border-2 border-black bg-white p-1 md:hidden shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-4 p-5 overflow-y-auto bg-[#F4F4F5]">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <motion.div 
                whileHover={{ scale: 1.02, x: 4 }} 
                whileTap={{ scale: 0.98 }} 
                key={item.href}
              >
                <Link 
                  href={item.href} 
                  onClick={() => setIsOpen(false)} 
                  className={`flex items-center justify-between border-4 px-4 py-3 font-black uppercase transition-colors ${
                    active 
                      ? 'border-black bg-black text-[#FFE600] shadow-[4px_4px_0_0_#FFE600]' 
                      : 'border-black bg-white text-black shadow-[4px_4px_0_0_#000] hover:bg-zinc-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} className={active ? "text-[#FFE600]" : item.color} />
                    {item.name}
                  </div>
                  {active && <ChevronRight size={20} className="text-[#FFE600]" />}
                </Link>
              </motion.div>
            )
          })}
        </nav>

        {/* Gamified Footer Profile */}
        <div className="border-t-4 border-black p-4 bg-zinc-100 flex flex-col gap-4">
          
          {/* RPG Profile Badge */}
          <div className="border-4 border-black bg-white p-3 shadow-[4px_4px_0_0_#000] relative">
            <div className="absolute -top-3 -right-3 bg-[#FFE600] border-2 border-black font-black text-xs px-2 py-0.5 rotate-6 shadow-[2px_2px_0_0_#000]">
              PRO
            </div>
            
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-black bg-[#A855F7] text-white font-black text-xl shadow-[2px_2px_0_0_#000]">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate font-black text-sm uppercase">{displayName}</p>
                <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-500">
                  <Shield size={12} className="text-blue-500" /> LVL 5 HUNTER
                </div>
              </div>
            </div>

            {/* XP Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-black uppercase">
                <span>XP</span>
                <span>450 / 1000</span>
              </div>
              <div className="h-3 w-full border-2 border-black bg-zinc-200 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '45%' }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-[#06B6D4] border-r-2 border-black relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 w-full h-full -skew-x-12 translate-x-4" />
                </motion.div>
              </div>
            </div>
          </div>

          {/* Quick Stats Bento */}
          <div className="grid grid-cols-2 gap-3">
            <div className="border-4 border-black bg-white p-2 flex flex-col items-center justify-center shadow-[4px_4px_0_0_#000] hover:-translate-y-1 transition-transform">
              <span className="text-xl font-black text-[#06B6D4]">1,402</span>
              <span className="text-[10px] font-black uppercase text-zinc-500">Leads</span>
            </div>
            <div className="border-4 border-black bg-white p-2 flex flex-col items-center justify-center shadow-[4px_4px_0_0_#000] hover:-translate-y-1 transition-transform">
              <span className="text-xl font-black text-[#FF5722]">14</span>
              <span className="text-[10px] font-black uppercase text-zinc-500">Quests</span>
            </div>
          </div>

          {/* Sign Out */}
          <SignOutButton redirectUrl="/landing">
            <button 
              type="button" 
              className="mt-2 flex w-full items-center justify-center gap-2 border-4 border-black bg-[#FF5722] p-3 font-black uppercase text-white shadow-[4px_4px_0_0_#000] hover:bg-orange-600 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
            >
              <LogOut size={18} strokeWidth={3} /> Log out
            </button>
          </SignOutButton>
        </div>
      </aside>
    </>
  )
}
