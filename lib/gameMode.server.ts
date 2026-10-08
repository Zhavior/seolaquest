import { cookies } from 'next/headers'
import { GAME_MODE_COOKIE, isGameModeOn } from './gameMode'

/** Server-side read of the game-layer setting; off unless set to "on". */
export async function readGameMode(): Promise<boolean> {
  const store = await cookies()
  return isGameModeOn(store.get(GAME_MODE_COOKIE)?.value)
}
