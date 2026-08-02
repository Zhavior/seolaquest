import { describe, expect, it } from 'vitest'
import {
  machineSecretConfigured,
  machineSecretsDistinctAndStrong,
  verifyMachineBearer,
} from './machineBearer'

const SECRET = 'ops-secret-0123456789abcdef0123456789'

describe('verifyMachineBearer', () => {
  it('fails closed when the secret is not configured', () => {
    expect(verifyMachineBearer('Bearer anything', undefined)).toBe('missing_config')
    expect(verifyMachineBearer('Bearer anything', '  ')).toBe('missing_config')
    expect(verifyMachineBearer('Bearer short', 'short')).toBe('missing_config')
  })

  it('requires the exact bearer value', () => {
    expect(verifyMachineBearer(`Bearer ${SECRET}`, SECRET)).toBe('authorized')
    expect(verifyMachineBearer('Bearer wrong', SECRET)).toBe('unauthorized')
    expect(verifyMachineBearer(null, SECRET)).toBe('unauthorized')
  })

  it('requires distinct strong values for privileged machine boundaries', () => {
    const other = 'cron-secret-0123456789abcdef012345678'
    expect(machineSecretConfigured(SECRET)).toBe(true)
    expect(machineSecretsDistinctAndStrong([SECRET, other])).toBe(true)
    expect(machineSecretsDistinctAndStrong([SECRET, SECRET])).toBe(false)
    expect(machineSecretsDistinctAndStrong([SECRET, 'short'])).toBe(false)
  })
})
