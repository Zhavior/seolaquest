interface RoomHeaderProps {
  icon: string
  room: string
  title: string
  description: string
  badge?: string
}

export default function RoomHeader({
  icon,
  room,
  title,
  description,
  badge = "LIVE",
}: RoomHeaderProps) {
  return (
    <header className="mb-8 border-4 border-black bg-[#FFE66D] shadow-[8px_8px_0_0_#000]">
      <div className="flex items-center justify-between border-b-4 border-black px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center border-4 border-black bg-white text-3xl">
            {icon}
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em]">
              {room}
            </p>

            <h1 className="text-4xl font-black uppercase">
              {title}
            </h1>
          </div>
        </div>

        <span className="border-4 border-black bg-[#5EF2B6] px-3 py-1 font-black uppercase">
          {badge}
        </span>
      </div>

      <div className="px-6 py-5">
        <p className="max-w-3xl text-lg font-bold">
          {description}
        </p>
      </div>
    </header>
  )
}
