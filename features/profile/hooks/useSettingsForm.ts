import { useState, useTransition, useMemo } from 'react'
import { updateSettingsAction } from '@/features/profile/actions'
import { sfx } from '@/lib/sfx'

export interface SettingsFormValues {
  name: string
  title: string
  email: string
  emailDigest: boolean
  radarAlerts: boolean
  crmWebhookUrl: string
}

export function useSettingsForm(initial: SettingsFormValues) {
  const [values, setValues] = useState<SettingsFormValues>(initial)
  const [notice, setNotice] = useState<string>('')
  const [isPending, startTransition] = useTransition()

  // Modal open states
  const [isLawsOpen, setIsLawsOpen] = useState(false)
  const [isBugModalOpen, setIsBugModalOpen] = useState(false)
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false)

  const isDirty = useMemo(() => {
    return (
      values.name !== initial.name ||
      values.title !== initial.title ||
      values.emailDigest !== initial.emailDigest ||
      values.radarAlerts !== initial.radarAlerts ||
      values.crmWebhookUrl !== initial.crmWebhookUrl
    )
  }, [values, initial])

  const setField = <K extends keyof SettingsFormValues>(field: K, val: SettingsFormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: val }))
  }

  const save = () => {
    startTransition(async () => {
      const result = await updateSettingsAction({
        name: values.name,
        title: values.title,
        emailDigest: values.emailDigest,
        radarAlerts: values.radarAlerts,
        crmWebhookUrl: values.crmWebhookUrl,
      })
      if (result.ok) {
        sfx.playCoinDrop()
        setNotice('Settings saved successfully.')
      } else {
        sfx.playCriticalWarning()
        setNotice(result.message ?? 'Could not save settings.')
      }
    })
  }

  const resetForm = () => {
    setValues(initial)
    sfx.playHoverBlip()
  }

  return {
    values,
    setField,
    isDirty,
    isPending,
    notice,
    setNotice,
    save,
    resetForm,
    isLawsOpen,
    setIsLawsOpen,
    isBugModalOpen,
    setIsBugModalOpen,
    isFeedbackModalOpen,
    setIsFeedbackModalOpen,
  }
}
