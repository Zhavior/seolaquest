import { SAMPLE_SETS } from '../sample/data'

/**
 * The four invented posts that play in the home hero, one beacon each. Picked
 * from the first sample set so the three tiers of the Aurora rules all show up:
 * a score of 91 (engage), 72 and 58 (watch) and 22 (ignore).
 */
export const HERO_POSTS = [0, 2, 3, 4].map((i) => SAMPLE_SETS[0].posts[i])

export const HERO_SCORES = HERO_POSTS.map((post) => post.score)
