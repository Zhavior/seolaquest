'use client'

import React, { useState, useEffect } from 'react'
import LowManaToast from '@/components/LowManaToast'
import ManaShopModal from '@/components/ManaShopModal'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isShopOpen, setIsShopOpen] = useState(false)
  const [userData, setUserData] = useState<any>(null)

  useEffect(() => {
    fetch('/api/user/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUserData(data.user)
        }
      })
      .catch(() => {})
  }, [])

  const handlePotionSuccess = (questsAdded: number) => {
    if (userData) {
      setUserData((prev: any) => ({
        ...prev,
        questsRemaining: prev.questsRemaining + questsAdded
      }))
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F0EA] text-black">
      {/* DEV ENTERPRISE BANNER */}
      <div className="bg-black text-[#FFE600] text-xs font-black px-4 py-2 border-b-2 border-black flex items-center justify-between">
        <span>🐉 DEV SESSION ACTIVE: {userData?.name || 'Loading Enterprise Overlord...'}</span>
        <span className="bg-[#EF4444] text-white text-[10px] px-2 py-0.5 border border-black uppercase font-black">
          {userData?.subscriptionTier || 'ENTERPRISE'}
        </span>
      </div>

      {/* GLOBAL POP-DOWN WARNING */}
      {userData && (
        <LowManaToast
          remainingCredits={userData.questsRemaining}
          totalCredits={userData.maxCredits || 100000}
          onOpenShop={() => setIsShopOpen(true)}
        />
      )}

      {/* MAIN CONTENT */}
      <main>{children}</main>

      {/* MANA POTION SHOP MODAL */}
      {isShopOpen && (
        <ManaShopModal
          onClose={() => setIsShopOpen(false)}
          onPurchaseSuccess={handlePotionSuccess}
        />
      )}
    </div>
  )
}
