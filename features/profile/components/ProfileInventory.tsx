import { InventorySlot } from '@/features/profile/types'

export function ProfileInventory({ inventorySlots }: { inventorySlots: InventorySlot[] }) {
  const occupiedSlotCount = inventorySlots.filter((slot) => slot.rarity !== 'EMPTY').length

  return (
    <div className="bg-card rounded-[20px] border border-outline shadow-sm p-6">
      <div className="flex justify-between items-center mb-6 border-b border-outline pb-4">
        <h2 className="font-display text-2xl font-semibold normal-case tracking-tight flex items-center gap-2">
          🎒 HUNTER STASH
        </h2>
        <span className="text-xs font-semibold bg-inset rounded-lg border border-outline px-2 py-0.5 shadow-none">
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
              className={`relative flex h-28 flex-col justify-between rounded-[20px] border p-2 ${
                slot.rarity !== 'EMPTY' 
                  ? `${slot.color} border-outline`
                  : 'bg-inset border-dashed border-hairline'
              }`}
            >
              {slot.rarity !== 'EMPTY' ? (
                <>
                  <div className="flex items-start">
                    <span className="text-xs font-semibold bg-black text-white px-1 border border-outline">
                      {slot.rarity}
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center my-auto">
                    {Icon && <Icon aria-hidden="true" className="w-7 h-7 stroke-[2.5]" />}
                  </div>

                  <div className="text-xs font-semibold truncate text-center">
                    {slot.name}
                  </div>
                  <span className="sr-only">{slot.stat}</span>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-ink-muted font-medium text-xs">
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
