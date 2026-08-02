import { timingSafeEqual } from 'node:crypto'

export type MachineBearerResult = 'authorized' | 'missing_config' | 'unauthorized'

export const MIN_MACHINE_SECRET_BYTES = 32

export function machineSecretConfigured(secret: string | undefined) {
  const configured = secret?.trim()
  return Boolean(configured && Buffer.byteLength(configured, 'utf8') >= MIN_MACHINE_SECRET_BYTES)
}

export function machineSecretsDistinctAndStrong(secrets: Array<string | undefined>) {
  const configured = secrets.map((secret) => secret?.trim())
  return configured.every((secret) => machineSecretConfigured(secret))
    && new Set(configured).size === configured.length
}

export function verifyMachineBearer(authorization: string | null, secret: string | undefined): MachineBearerResult {
  const configured = secret?.trim()
  if (!machineSecretConfigured(configured)) return 'missing_config'

  const expected = Buffer.from(`Bearer ${configured}`)
  const actual = Buffer.from(authorization ?? '')
  if (expected.length !== actual.length) return 'unauthorized'
  return timingSafeEqual(expected, actual) ? 'authorized' : 'unauthorized'
}
