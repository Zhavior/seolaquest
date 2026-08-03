export type LoadingStep =
  | "auth"
  | "profile"
  | "dashboard"
  | "leads"
  | "keywords"
  | "guild"
  | "render"

const weights: Record<LoadingStep, number> = {
  auth: 10,
  profile: 15,
  dashboard: 20,
  leads: 30,
  keywords: 10,
  guild: 10,
  render: 5,
}

const completed = new Set<LoadingStep>()

export function completeLoadingStep(step: LoadingStep): number {
  completed.add(step)

  return [...completed].reduce(
    (total, current) => total + weights[current],
    0,
  )
}

export function resetLoadingProgress() {
  completed.clear()
}
