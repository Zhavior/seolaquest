import { InventorySlot } from '@/features/profile/types'

export function ProfileInventory({ inventorySlots }: { inventorySlots: InventorySlot[] }) {
  const occupiedSlotCount = inventorySlots.filter((slot) => slot.rarity !== 'EMPTY').length

  return (
    <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
      <div className="flex justify-between items-center mb-6 border-b-4 border-black pb-4">
        <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
          🎒 HUNTER STASH
        </h2>
        <span className="text-xs font-black bg-slate-200 border-2 border-black px-2 py-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          {occupiedSlotCount} / {inventorySlots.length} SLOTS
        </span>
      </div>

      {/* 3x2 Grid */}
      <ul aria-label="Inventory slots" className="grid grid-cols-3 gap-3">
        {inventorySlots.map((slot) => {
          const Icon = slot.icon
          return (
            <li
              key={slot.id}
              className={`relative flex h-28 flex-col justify-between border-4 p-2 ${
                slot.rarity !== 'EMPTY' 
                  ? `${slot.color} border-black`
                  : 'bg-slate-100 border-dashed border-slate-300'
              }`}
            >
              {slot.rarity !== 'EMPTY' ? (
                <>
                  <div className="flex items-start">
                    <span className="text-xs font-black bg-black text-white px-1 border border-black">
                      {slot.rarity}
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center my-auto">
                    {Icon && <Icon aria-hidden="true" className="w-7 h-7 stroke-[2.5]" />}
                  </div>

                  <div className="text-xs font-black truncate text-center">
                    {slot.name}
                  </div>
                  <span className="sr-only">{slot.stat}</span>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 font-bold text-xs">
                  LOCKED
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
