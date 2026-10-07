/**
 * Clerk appearance shared by sign-in and sign-up.
 *
 * `variables` retheme Clerk to the Dusk Hunt panel (parchment on night violet,
 * old-gold primary, Barlow). The visible frame, hard shadow and button treatment come from
 * the `.hb-clerk` rules in handbook.css, because Clerk's own class hooks are the
 * only way to reach its internal markup. `elements` keeps every control at the
 * 44px touch target the accessibility gate asserts.
 */
export const clerkAppearance = {
  variables: {
    colorPrimary: '#D8A93B',
    colorBackground: '#1B1535',
    colorForeground: '#F6EBD2',
    colorMutedForeground: '#D9D0EC',
    colorInput: '#120E22',
    colorInputForeground: '#F6EBD2',
    colorNeutral: '#F6EBD2',
    borderRadius: '2px',
    fontFamily: 'var(--font-hb-text), system-ui, sans-serif',
  },
  options: { autoFocus: false },
  elements: {
    rootBox: 'flex w-full justify-center',
    cardBox: 'w-full',
    card: 'w-full',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    formFieldInput: { minHeight: '44px' },
    formButtonPrimary: { minHeight: '44px' },
    formFieldAction: { minHeight: '44px', display: 'inline-flex', alignItems: 'center' },
    formFieldInputShowPasswordButton: { minHeight: '44px', minWidth: '44px' },
    socialButtonsBlockButton: { minHeight: '44px' },
    socialButtonsIconButton: { minHeight: '44px', minWidth: '44px' },
    alternativeMethodsBlockButton: { minHeight: '44px' },
    otpCodeFieldInput: { minHeight: '44px', minWidth: '44px' },
    backLink: { minHeight: '44px', display: 'inline-flex', alignItems: 'center' },
    footerActionLink: { minHeight: '44px', display: 'inline-flex', alignItems: 'center' },
    formResendCodeLink: { minHeight: '44px', display: 'inline-flex', alignItems: 'center' },
  },
} as const
