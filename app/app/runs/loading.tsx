export default function ScanRunsLoading() {
  return (
    <div aria-label="Loading scan runs" className="space-y-4">
      {[0, 1, 2].map((item) => (
        <div key={item} className="h-52 animate-pulse border-4 border-black bg-zinc-200 shadow-[6px_6px_0_0_#000]" />
      ))}
    </div>
  )
}
