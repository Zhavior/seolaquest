export default function OSPreviewPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4EFE6]">
      <div className="border-4 border-outline bg-highlight p-12 shadow-brutal-lg">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-ink/60">
          SEOlaQuest OS Preview
        </p>

        <h1 className="text-5xl font-black tracking-tight">
          Battle Area Shell
        </h1>

        <p className="mt-4 max-w-xl text-lg font-semibold text-ink/70">
          The authenticated shell now requires a real signed-in user. This preview
          page intentionally renders outside that shell.
        </p>
      </div>
    </main>
  )
}
