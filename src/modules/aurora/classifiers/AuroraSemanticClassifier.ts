/**
 * Re-export, not a second declaration.
 *
 * This file used to redeclare `AuroraSemanticClassifier` with the same shape as the one in
 * `../types`. It compiled — TypeScript matches structurally — but it meant `AuroraService`
 * imported the port from here while every implementation implemented the one in `../types`,
 * so the two could drift apart and still typecheck until the shapes actually diverged.
 * Aliasing keeps the existing import path working with one source of truth behind it.
 */
export type { AuroraSemanticClassifier } from '../types';
