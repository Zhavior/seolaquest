import { useState, useTransition } from 'react'

export type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

export interface FeedbackFormValues {
  subject: string
  details: string
  category: 'bug' | 'feature' | 'general'
}

export function useFeedbackForm(
  onSubmitAction?: (values: FeedbackFormValues) => Promise<{ ok: boolean; message?: string }>,
  onSuccess?: () => void,
) {
  const [values, setValues] = useState<FeedbackFormValues>({
    subject: '',
    details: '',
    category: 'general',
  })
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [isPending, startTransition] = useTransition()

  const setField = <K extends keyof FeedbackFormValues>(field: K, val: FeedbackFormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: val }))
  }

  const reset = () => {
    setValues({ subject: '', details: '', category: 'general' })
    setStatus('idle')
    setErrorMessage('')
  }

  const submit = () => {
    if (!values.subject.trim()) {
      setStatus('error')
      setErrorMessage('Subject line is required.')
      return
    }

    setStatus('submitting')
    startTransition(async () => {
      try {
        if (onSubmitAction) {
          const res = await onSubmitAction(values)
          if (!res.ok) {
            setStatus('error')
            setErrorMessage(res.message || 'Submission failed.')
            return
          }
        }
        setStatus('success')
        if (onSuccess) onSuccess()
      } catch (err: unknown) {
        setStatus('error')
        setErrorMessage((err as Error).message || 'Unexpected error occurred.')
      }
    })
  }

  return {
    values,
    setField,
    status,
    errorMessage,
    isPending,
    submit,
    reset,
  }
}
