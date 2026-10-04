/**
 * Clerk appearance shared by sign-in and sign-up.
 *
 * `variables` retheme Clerk to the handbook (ink on milk, square corners, the
 * handbook sans). The visible frame, hard shadow and button treatment come from
 * the `.hb-clerk` rules in handbook.css, because Clerk's own class hooks are the
 * only way to reach its internal markup. `elements` keeps every control at the
 * 44px touch target the accessibility gate asserts.
 */
export const clerkAppearance = {
  variables: {
    colorPrimary: '#14120E',
    colorBackground: '#FFFDF7',
    colorForeground: '#14120E',
    colorMutedForeground: '#4A4538',
    colorInput: '#FFFDF7',
    colorInputForeground: '#14120E',
    borderRadius: '0px',
    fontFamily: 'var(--font-hb-sans), Helvetica Neue, Arial, sans-serif',
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
