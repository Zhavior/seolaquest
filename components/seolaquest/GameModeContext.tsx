'use client'

import { createContext, useContext, type ReactNode } from 'react'

const GameModeContext = createContext(false)

/** Provided once by the signed-in layout from the server-read cookie. */
export function GameModeProvider({ on, children }: { on: boolean; children: ReactNode }) {
  return <GameModeContext.Provider value={on}>{children}</GameModeContext.Provider>
}

/** True when the person turned on XP, levels and goals in Settings. Off by default. */
export function useGameMode(): boolean {
  return useContext(GameModeContext)
}
