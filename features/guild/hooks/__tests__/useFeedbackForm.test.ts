import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFeedbackForm } from '../useFeedbackForm'

describe('useFeedbackForm', () => {
  it('starts in idle status', () => {
    const { result } = renderHook(() => useFeedbackForm())

    expect(result.current.status).toBe('idle')
    expect(result.current.values.subject).toBe('')
  })

  it('fails submission if subject line is empty', () => {
    const { result } = renderHook(() => useFeedbackForm())

    act(() => {
      result.current.submit()
    })

    expect(result.current.status).toBe('error')
    expect(result.current.errorMessage).toBe('Subject line is required.')
  })

  it('progresses status to success on valid submission', async () => {
    const mockAction = vi.fn().mockResolvedValue({ ok: true })
    const { result } = renderHook(() => useFeedbackForm(mockAction))

    act(() => {
      result.current.setField('subject', 'Feature request: dark mode')
    })

    await act(async () => {
      result.current.submit()
    })

    expect(mockAction).toHaveBeenCalledWith({
      subject: 'Feature request: dark mode',
      details: '',
      category: 'general',
    })
    expect(result.current.status).toBe('success')
  })

  it('resets form state back to idle', () => {
    const { result } = renderHook(() => useFeedbackForm())

    act(() => {
      result.current.setField('subject', 'Some title')
      result.current.submit()
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.status).toBe('idle')
    expect(result.current.values.subject).toBe('')
    expect(result.current.errorMessage).toBe('')
  })
})
