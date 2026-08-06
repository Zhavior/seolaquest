# SEOlaQuest World Layer

This folder isolates the living visualization engine from business logic.

## Event layers

1. Business events
   - Truth from the pipeline.
   - Examples: scan_started, post_discovered, lead_qualified, scan_finished.

2. World events
   - Theme-specific simulation events.
   - Examples: expedition_started, encounter_spawned, loot_spawned, xp_gained.

3. Animation events
   - Render-only instructions for Pixi/GSAP.
   - Examples: play_attack, play_hit, play_loot_drop.

## Rules

- Backend emits business events only.
- Adapters translate business events into world events.
- Renderer consumes serializable state only.
- No Pixi objects in Zustand.
- Replay should be driven from recorded business events, then remapped deterministically.
