export default function RootLoading() {
  return (
    <div className="min-h-screen w-full bg-[#F4F0EA] flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4 bg-white border-4 border-black p-8 shadow-[8px_8px_0_0_#000]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-black border-t-[#ff4500]" />
        <p className="font-black uppercase tracking-widest text-sm text-black">
          Loading CoQuest Engine...
        </p>
      </div>
    </div>
  )
}
