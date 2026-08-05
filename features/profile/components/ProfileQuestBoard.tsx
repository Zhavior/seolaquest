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
    <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
      
      {/* Quest Board Header */}
      <div className="flex justify-between items-center mb-6 border-b-4 border-black pb-4">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-7 h-7 text-black stroke-[3]" />
          <h2 className="text-2xl font-black uppercase tracking-tight">ACTIVE QUEST BOARD</h2>
        </div>
        <span className="bg-emerald-400 border-2 border-black px-2.5 py-1 text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          {quests.filter((q) => !q.completed).length} REMAINING
        </span>
      </div>

      {/* Add New Quest Form */}
      <form onSubmit={addQuest} className="flex gap-2 mb-6">
        <label htmlFor="new-quest-title" className="sr-only">New personal task</label>
        <input
          id="new-quest-title"
          type="text"
          placeholder="CREATE A NEW QUEST / TO-DO..."
          value={newQuestTitle}
          onChange={(e) => setNewQuestTitle(e.target.value)}
          className="flex-1 bg-slate-100 border-4 border-black p-3 text-sm font-bold focus:outline-none focus:bg-yellow-100 transition-colors placeholder:text-slate-400"
        />
        <button
          type="submit"
          aria-label="Add personal task"
          className="bg-black text-white px-5 border-4 border-black font-black flex items-center justify-center hover:bg-emerald-400 hover:text-black transition-all active:translate-x-1 active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>
      </form>

      {/* Quest List */}
      <div className="space-y-3">
        {quests.length === 0 && (
          <p className="border-2 border-dashed border-gray-400 p-5 text-center text-sm font-bold text-gray-600">
            No personal tasks have been added in this browser session.
          </p>
        )}
        {quests.map((quest) => (
          <button
            type="button"
            key={quest.id}
            onClick={() => toggleQuest(quest.id)}
            aria-pressed={quest.completed}
            className={`w-full border-4 border-black p-4 flex items-center justify-between text-left cursor-pointer transition-all ${
              quest.completed 
                ? 'bg-slate-200 opacity-60 line-through' 
                : 'bg-yellow-50 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 border-2 border-black flex items-center justify-center font-black ${quest.completed ? 'bg-black text-white' : 'bg-white'}`}>
                {quest.completed && '✓'}
              </div>
              <div>
                <p className="font-black text-sm">{quest.title}</p>
                <div className="flex items-center gap-3 mt-1 text-xs font-bold text-slate-600">
                  <span className="flex items-center gap-1 text-red-600">
                    <Clock className="w-3.5 h-3.5" /> {quest.dueDate}
                  </span>
                  <span className={`shrink-0 px-1.5 py-0.5 border border-black text-xs font-black ${
                    quest.priority === 'HIGH' ? 'bg-red-400 text-black' : quest.priority === 'MED' ? 'bg-yellow-300 text-black' : 'bg-slate-300 text-black'
                  }`}>
                    {quest.priority}
                  </span>
                </div>
              </div>
            </div>

            <span className="bg-slate-200 border-2 border-black px-2 py-0.5 text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">No XP awarded</span>
          </button>
        ))}
      </div>
    </div>
  )
}
