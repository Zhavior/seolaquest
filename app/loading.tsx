export default function RootLoading() {
  return (
    <div className="min-h-screen w-full bg-canvas flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4 bg-card border-4 border-outline p-8 shadow-brutal-lg">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-outline border-t-[#ff4500]" />
        <p className="font-black uppercase tracking-widest text-sm text-ink">
          Loading SEOlaQuest Engine...
        </p>
      </div>
    </div>
  )
}
