import 'server-only'
import { TwitterApi } from 'twitter-api-v2'
import { getServerEnv } from './env'

export function getXClient(): TwitterApi | null {
  const env = getServerEnv()
  if (!env.X_API_KEY || !env.X_API_SECRET || !env.X_ACCESS_TOKEN || !env.X_ACCESS_TOKEN_SECRET) {
    return null
  }

  return new TwitterApi({
    appKey: env.X_API_KEY,
    appSecret: env.X_API_SECRET,
    accessToken: env.X_ACCESS_TOKEN,
    accessSecret: env.X_ACCESS_TOKEN_SECRET,
  })
}
