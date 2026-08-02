export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Canonical authenticated product pages own their shell under /app. This
  // route group remains only for /onboarding; legacy siblings redirect in
  // proxy.ts and must not add a second navigation or main landmark.
  return children
}
