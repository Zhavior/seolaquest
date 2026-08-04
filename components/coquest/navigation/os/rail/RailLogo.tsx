'use client'

export default function RailLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={[
        'flex items-center justify-center transition-all duration-200',
        compact ? 'h-14 w-14' : 'h-14 w-14',
      ].join(' ')}
    >
      <div className="flex h-12 w-12 items-center justify-center border-4 border-black bg-[#FFD84D] font-black text-black shadow-[4px_4px_0_0_#000]">
        CQ
      </div>
    </div>
  )
}
