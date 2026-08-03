export function AnimatedBackgroundWeapons() {
  return (
    <div aria-hidden="true" className="absolute inset-0 z-0 overflow-hidden pointer-events-none hidden md:block">
      <div className="absolute top-20 left-10 h-24 w-24 rotate-[-12deg] border-4 border-black/10 bg-black/5" />
      <div className="absolute top-1/3 right-20 h-20 w-20 rotate-[8deg] border-4 border-black/10 bg-black/5" />
      <div className="absolute bottom-40 left-1/4 h-28 w-28 rotate-[14deg] border-4 border-black/10 bg-black/5" />
      <div className="absolute bottom-20 right-1/4 h-24 w-24 rotate-[-8deg] border-4 border-black/10 bg-black/5" />
    </div>
  )
}
