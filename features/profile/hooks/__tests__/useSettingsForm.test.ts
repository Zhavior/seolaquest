import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSettingsForm, SettingsFormValues } from '../useSettingsForm'

vi.mock('../../actions', () => ({
  updateSettingsAction: vi.fn().mockResolvedValue({ ok: true }),
}))

const initialValues: SettingsFormValues = {
  name: 'Hunter Santos',
  title: 'Knight Slasher',
  email: 'hunter@example.com',
  emailDigest: true,
  radarAlerts: false,
  crmWebhookUrl: 'https://hooks.zapier.com/test',
}

describe('useSettingsForm', () => {
  it('initializes with values and clean dirty state', () => {
    const { result } = renderHook(() => useSettingsForm(initialValues))

    expect(result.current.values.name).toBe('Hunter Santos')
    expect(result.current.isDirty).toBe(false)
  })

  it('updates field and sets isDirty to true', () => {
    const { result } = renderHook(() => useSettingsForm(initialValues))

    act(() => {
      result.current.setField('name', 'Master Hunter')
    })

    expect(result.current.values.name).toBe('Master Hunter')
    expect(result.current.isDirty).toBe(true)
  })

  it('resets form back to initial values', () => {
    const { result } = renderHook(() => useSettingsForm(initialValues))

    act(() => {
      result.current.setField('name', 'Modified Name')
    })
    expect(result.current.isDirty).toBe(true)

    act(() => {
      result.current.resetForm()
    })

    expect(result.current.values.name).toBe('Hunter Santos')
    expect(result.current.isDirty).toBe(false)
  })

  it('triggers save action and updates notice', async () => {
    const { result } = renderHook(() => useSettingsForm(initialValues))

    await act(async () => {
      result.current.save()
    })

    expect(result.current.notice).toBe('Settings saved successfully.')
  })
})
