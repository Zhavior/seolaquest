/**
 * The mark: a divider leaf with a stepped tab and a punch hole. It is the
 * product's own object (the handbook page), drawn from the same three things
 * the site is built from, rather than a generic sword or bolt.
 */
export function HandbookMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect x="2" y="3" width="22" height="26" fill="#F2C400" stroke="#FFFDF7" strokeWidth="2" />
      <path d="M24 8h5v7h-5zM24 17h5v7h-5z" fill="#0F8B8D" stroke="#FFFDF7" strokeWidth="2" />
      <circle cx="8" cy="9" r="2.3" fill="#14120E" stroke="#FFFDF7" strokeWidth="1.5" />
      <circle cx="8" cy="23" r="2.3" fill="#14120E" stroke="#FFFDF7" strokeWidth="1.5" />
      <path d="M13 12h7M13 16h7M13 20h4" stroke="#14120E" strokeWidth="2" />
    </svg>
  )
}
