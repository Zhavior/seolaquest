'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'

type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
type TrackedKeywordInsert = Database['public']['Tables']['tracked_keywords']['Insert']

const ALLOWED_USER_CLASSES = ['Dragon Slayer', 'Scout', 'Mage'] as const

type AllowedUserClass = (typeof ALLOWED_USER_CLASSES)[number]

export type CompleteOnboardingInput = {
  username: string
  userClass: AllowedUserClass
  initialKeywords: Array<{
    keyword: string
    category: string
  }>
}

function normalizeUsername(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

function normalizeKeyword(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

function validateUsername(username: string): string | null {
  if (username.length < 3 || username.length > 32) {
    return 'Username must be between 3 and 32 characters.'
  }

  if (!/^[a-zA-Z0-9 _-]+$/.test(username)) {
    return 'Username may only contain letters, numbers, spaces, underscores, and hyphens.'
  }

  return null
}

function validateUserClass(userClass: string): userClass is AllowedUserClass {
  return ALLOWED_USER_CLASSES.includes(userClass as AllowedUserClass)
}

function dedupeKeywords(
  initialKeywords: CompleteOnboardingInput['initialKeywords']
): CompleteOnboardingInput['initialKeywords'] {
  const seen = new Set<string>()

  return initialKeywords.filter((entry) => {
    const keyword = normalizeKeyword(entry.keyword)
    const category = normalizeKeyword(entry.category)
    const key = `${keyword.toLowerCase()}::${category.toLowerCase()}`

    if (!keyword || !category || seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

function parseFormData(formData: FormData): CompleteOnboardingInput {
  const usernameRaw = formData.get('username')
  const userClassRaw = formData.get('userClass')
  const initialKeywordsRaw = formData.get('initialKeywords')

  if (typeof usernameRaw !== 'string') {
    throw new Error('Missing username.')
  }

  if (typeof userClassRaw !== 'string') {
    throw new Error('Missing user class.')
  }

  if (typeof initialKeywordsRaw !== 'string') {
    throw new Error('Missing initial keywords.')
  }

  let parsedKeywords: unknown

  try {
    parsedKeywords = JSON.parse(initialKeywordsRaw)
  } catch {
    throw new Error('Initial keywords payload is invalid JSON.')
  }

  if (!Array.isArray(parsedKeywords)) {
    throw new Error('Initial keywords payload must be an array.')
  }

  const initialKeywords = parsedKeywords.map((entry) => {
    if (
      typeof entry !== 'object' ||
      entry === null ||
      !('keyword' in entry) ||
      !('category' in entry)
    ) {
      throw new Error('Each keyword entry must include keyword and category.')
    }

    const keyword = normalizeKeyword(String(entry.keyword))
    const category = normalizeKeyword(String(entry.category))

    if (!keyword || !category) {
      throw new Error('Keyword and category cannot be empty.')
    }

    if (keyword.length > 120) {
      throw new Error(`Keyword "${keyword}" exceeds 120 characters.`)
    }

    if (category.length > 50) {
      throw new Error(`Category "${category}" exceeds 50 characters.`)
    }

    return { keyword, category }
  })

  const username = normalizeUsername(usernameRaw)

  return {
    username,
    userClass: userClassRaw as AllowedUserClass,
    initialKeywords: dedupeKeywords(initialKeywords),
  }
}

export async function completeOnboarding(formData: FormData): Promise<never> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    throw new Error(`Authentication failed: ${authError.message}`)
  }

  if (!user) {
    redirect('/login')
  }

  const { username, userClass, initialKeywords } = parseFormData(formData)

  const usernameError = validateUsername(username)
  if (usernameError) {
    throw new Error(usernameError)
  }

  if (!validateUserClass(userClass)) {
    throw new Error('Invalid user class selected.')
  }

  if (initialKeywords.length === 0) {
    throw new Error('At least one initial keyword is required.')
  }

  const profilePatch: ProfileUpdate = {
    username,
    user_class: userClass,
    current_mp: 50,
    max_mp: 100,
    onboarding_completed: true,
  }

  const keywordRows: TrackedKeywordInsert[] = initialKeywords.map((entry) => ({
    user_id: user.id,
    keyword: entry.keyword,
    category: entry.category,
  }))

  const {
    data: previousProfile,
    error: previousProfileError,
  } = await supabase
    .from('profiles')
    .select('username, user_class, current_mp, max_mp, onboarding_completed')
    .eq('id', user.id)
    .single()

  if (previousProfileError) {
    throw new Error(`Failed to load current profile: ${previousProfileError.message}`)
  }

  const { error: profileUpdateError } = await supabase
    .from('profiles')
    .update(profilePatch)
    .eq('id', user.id)

  if (profileUpdateError) {
    throw new Error(`Failed to update profile: ${profileUpdateError.message}`)
  }

  const { error: deleteExistingKeywordsError } = await supabase
    .from('tracked_keywords')
    .delete()
    .eq('user_id', user.id)

  if (deleteExistingKeywordsError) {
    await supabase.from('profiles').update(previousProfile).eq('id', user.id)
    throw new Error(
      `Failed to reset existing tracked keywords: ${deleteExistingKeywordsError.message}`
    )
  }

  const { error: insertKeywordsError } = await supabase
    .from('tracked_keywords')
    .insert(keywordRows)

  if (insertKeywordsError) {
    await supabase.from('profiles').update(previousProfile).eq('id', user.id)
    throw new Error(`Failed to insert tracked keywords: ${insertKeywordsError.message}`)
  }

  revalidateTag('profile', 'max')
  revalidateTag('tracked-keywords', 'max')
  revalidatePath('/app', 'layout')
  revalidatePath('/app')
  redirect('/app')
}
