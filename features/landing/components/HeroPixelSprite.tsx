export default function HeroPixelSprite() {
  return (
    <div className="h-64 w-full sm:h-96 border-4 border-black bg-[linear-gradient(135deg,#ffe600_0%,#ff8c42_50%,#ff4500_100%)] shadow-[8px_8px_0_0_#000] flex items-center justify-center">
      <div className="text-center px-6">
        <div className="mx-auto mb-4 h-16 w-16 sm:h-24 sm:w-24 border-4 border-black bg-white shadow-[4px_4px_0_0_#000]" />
        <p className="text-lg sm:text-2xl font-black uppercase tracking-widest">
          Research Engine
        </p>
      </div>
    </div>
  )
}
