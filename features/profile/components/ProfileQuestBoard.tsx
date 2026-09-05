import { CheckSquare, Plus, Clock } from 'lucide-react'
import { QuestItem } from '@/features/profile/types'

type ProfileQuestBoardProps = {
  quests: QuestItem[]
  newQuestTitle: string
  setNewQuestTitle: (title: string) => void
  addQuest: (e: React.FormEvent) => void
  toggleQuest: (id: number | string) => void
}

export function ProfileQuestBoard({
  quests,
  newQuestTitle,
  setNewQuestTitle,
  addQuest,
  toggleQuest
}: ProfileQuestBoardProps) {
  return (
    <div className="bg-card rounded-[20px] border border-outline shadow-sm p-6">
      
      {/* Quest Board Header */}
      <div className="flex justify-between items-center mb-6 border-b border-outline pb-4">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-7 h-7 text-ink stroke-[3]" />
          <h2 className="font-display text-2xl font-semibold normal-case tracking-tight">ACTIVE QUEST BOARD</h2>
        </div>
        <span className="bg-success rounded-lg border border-outline px-2.5 py-1 text-xs font-semibold shadow-none">
          {quests.filter((q) => !q.completed).length} REMAINING
        </span>
      </div>

      {/* Add New Quest Form */}
      <form onSubmit={addQuest} className="flex gap-2 mb-6">
        <label htmlFor="new-quest-title" className="sr-only">New personal task</label>
        <input
          id="new-quest-title"
          type="text"
          placeholder="Add a personal task..."
          value={newQuestTitle}
          onChange={(e) => setNewQuestTitle(e.target.value)}
          className="min-w-0 flex-1 bg-inset rounded-[20px] border border-outline p-3 text-sm font-medium focus:outline-none focus:bg-highlight transition-colors placeholder:text-ink-muted"
        />
        <button
          type="submit"
          aria-label="Add personal task"
          className="bg-black text-white px-5 rounded-[20px] border border-outline font-semibold flex items-center justify-center hover:bg-success hover:text-ink transition-all active:translate-x-1 active:translate-y-1 shadow-sm"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>
      </form>

      {/* Quest List */}
      <div className="space-y-3">
        {quests.length === 0 && (
          <p className="rounded-lg border border-dashed border-hairline p-5 text-center text-sm font-medium text-ink-muted">
            No personal tasks have been added in this browser session.
          </p>
        )}
        {quests.map((quest) => (
          <button
            type="button"
            key={quest.id}
            onClick={() => toggleQuest(quest.id)}
            aria-pressed={quest.completed}
            className={`w-full rounded-[20px] border border-outline p-4 flex items-center justify-between text-left cursor-pointer transition-all ${
              quest.completed 
                ? 'bg-inset opacity-60 line-through' 
                : 'bg-card hover:-translate-y-1 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-lg border border-outline flex items-center justify-center font-semibold ${quest.completed ? 'bg-black text-white' : 'bg-card'}`}>
                {quest.completed && '✓'}
              </div>
              <div>
                <p className="font-semibold text-sm">{quest.title}</p>
                <div className="flex items-center gap-3 mt-1 text-xs font-medium text-ink-muted">
                  <span className="flex items-center gap-1 text-red-600">
                    <Clock className="w-3.5 h-3.5" /> {quest.dueDate}
                  </span>
                  <span className={`shrink-0 px-1.5 py-0.5 border border-outline text-xs font-semibold ${
                    quest.priority === 'HIGH' ? 'bg-red-400 text-ink' : quest.priority === 'MED' ? 'bg-yellow-300 text-ink' : 'bg-slate-300 text-ink'
                  }`}>
                    {quest.priority}
                  </span>
                </div>
              </div>
            </div>

            <span className="bg-inset rounded-lg border border-outline px-2 py-0.5 text-xs font-semibold shadow-none shrink-0">No XP awarded</span>
          </button>
        ))}
      </div>
    </div>
  )
}
