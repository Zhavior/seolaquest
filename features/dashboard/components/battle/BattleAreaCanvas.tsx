'use client'

import dynamic from 'next/dynamic'

// Client-Side Only Dynamic Import with { ssr: false } for 3D Three.js / R3F Canvas Engine
const BattleArea3DInner = dynamic(
  () => import('./BattleArea3DInner').then((mod) => mod.BattleArea3DInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-emerald-950 font-mono text-xs font-black uppercase text-[#FFE600]">
        ⚔️ Loading 3D Isometric Viewport Engine...
      </div>
    ),
  }
)

export default function BattleAreaCanvas({ userLevel }: { userLevel?: number }) {
  return (
    <section
      aria-label="3D Expedition Battle Area Viewport"
      className="relative h-[320px] w-full overflow-hidden border-4 border-black bg-emerald-950 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] md:h-[400px]"
    >
      <BattleArea3DInner userLevel={userLevel} />
    </section>
  )
}
