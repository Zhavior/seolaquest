import CoQuestShell from '@/components/coquest/navigation/os-v2/CoQuestShell'

export default function ShellV2Preview() {
  return (
    <CoQuestShell>
      <div className="flex h-full min-h-[calc(100vh-80px)] items-center justify-center bg-[#F4EFE6]">
        <div className="border-[3px] border-outline bg-highlight p-10 shadow-brutal-lg">
          <h1 className="text-3xl font-black uppercase">
            ⚔ CoQuest Shell V2
          </h1>

          <p className="mt-4 font-semibold">
            This is the isolated shell preview.
          </p>
        </div>
      </div>
    </CoQuestShell>
  )
}
