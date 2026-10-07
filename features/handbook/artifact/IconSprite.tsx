import { SPRITE_DEFS } from './sprite'

/**
 * Renders the shared icon sprite once. It is sized to nothing rather than
 * hidden with display:none, because browsers drop gradient references from an
 * SVG that is not rendered.
 */
export function IconSprite() {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: 'absolute' }}
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: `<defs>${SPRITE_DEFS}</defs>` }}
    />
  )
}

export type IconName =
  | 'crest' | 'spyglass' | 'eye' | 'sword' | 'chest' | 'gem-leg' | 'gem-rare' | 'gem-common' | 'scroll'
  | 'hourglass' | 'shield' | 'star' | 'compass' | 'map' | 'crown' | 'lighthouse' | 'flag' | 'padlock'
  | 'medal' | 'level' | 'mk-avail' | 'mk-ready' | 'mk-lock'

/** A symbol from the sprite. Decorative unless `label` is given. */
export function Icon({ name, size = 24, label, className }: { name: IconName; size?: number; label?: string; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <use href={`#i-${name}`} />
    </svg>
  )
}

/** An icon set on the engraved plate, as used for the route stops. */
export function PlateIcon({ name, size = 84, label }: { name: IconName; size?: number; label?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <use href="#plate" width="96" height="96" />
      <use href={`#i-${name}`} x="11" y="11" width="74" height="74" />
    </svg>
  )
}
