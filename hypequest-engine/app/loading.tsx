export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-black border-t-[#ffd700]"></div>
        <p className="font-black uppercase tracking-wider text-black">Loading...</p>
      </div>
    </div>
  )
}
