/**
 * The game layer (XP, levels, Goals and the Activity stat cards) is optional
 * and off unless the person turns it on in Settings. Research on games imposed
 * at work found they help only people who opt in, and here the game wording
 * had confused the core tasks.
 *
 * Stored in a cookie rather than localStorage so server components (the menu,
 * the header) render the right thing on the first paint, with no flash.
 */
export const GAME_MODE_COOKIE = 'sq-game'

export function isGameModeOn(value: string | undefined | null): boolean {
  return value === 'on'
}

/** Cookie string the browser writes when the person flips the setting. */
export function gameModeCookie(on: boolean): string {
  return `${GAME_MODE_COOKIE}=${on ? 'on' : 'off'}; path=/; max-age=31536000; samesite=lax`
}
