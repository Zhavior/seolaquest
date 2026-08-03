export function RoomHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <section className="border-b-4 border-black bg-[#F4F0EA] shadow-[0_4px_0_0_#000]">
      <div className="mx-auto flex w-full max-w-[1600px] items-center gap-3 px-3 py-4 sm:px-4 lg:px-5">
        <div className="flex min-h-12 min-w-12 items-center justify-center border-4 border-black bg-white text-xl">
          {icon}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-black uppercase tracking-[0.16em] sm:text-base">{title}</h1>
          <p className="truncate text-[11px] font-black uppercase tracking-[0.12em] text-black/70 sm:text-xs">{subtitle}</p>
        </div>
      </div>
    </section>
  )
}
