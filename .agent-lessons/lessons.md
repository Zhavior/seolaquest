# Agent lessons

Schema: id | date | symptom | root_cause | rule | applies_when | status(active|superseded)

Do not invent past lessons. Curate: supersede stale; merge dupes; only durable mistakes.

id: L001
date: 2026-08-09
symptom: HUD value assertions like getByText('18/50 MP') fail even though the number is on screen
root_cause: Testing Library joins only an element's DIRECT text children, so a two-tone `{n}<span>/{max}</span> MP` reading is never one string
rule: Render a numeric reading as a single text run (build the string in JS); style the pill, not fragments of the number
applies_when: Status bar / HUD / meter markup in os-v2 shell components
status: active
---

id: L002
date: 2026-08-09
symptom: New pills added to the shell status bar clipped the RECHARGE CTA at 768px and 1024px while unit tests stayed green
root_cause: Fixed-height single-row header shared with brand + toggles + CTA has no width budget left; jsdom has no layout engine so tests cannot see it
rule: Before shipping status-bar additions, render the real component with renderToStaticMarkup plus the postcss-built globals.css into iframes at 390/768/1024/1280/1440 and look; reveal label at md, meter at lg, raw numbers at xl
applies_when: Adding anything to StatusBar / ShellHud or any fixed-height shell chrome
status: active
---

id: L003
date: 2026-08-09
symptom: Lint reported unused variables in a component and deleting them looked like the obvious cleanup
root_cause: The dead variables were the residue of UI deleted by an unrelated commit; the doc comment, ShellUser type, tests and a per-request countOpenQuests query all still described the missing markup
rule: When a component computes values it never renders, check git log -S for the deleted JSX and whether the server still pays for the data before deleting; restore the UI when the data path is still funded
applies_when: Triaging no-unused-vars warnings in shell/HUD components
status: active
---

id: L004
date: 2026-08-10
symptom: Battlestation feed polluted by $CRM trading chatter, hiring posts, and tall unscored "Tactical Read" boxes
root_cause: Keyword matches treat cashtags/job copy as buyer intent; ops/application has no lead filter — real gates are filterQualifiedRecords + DeterministicScorer; unscored UI always rendered a full prose block
rule: Put ticker/job/discord exclusions in leads/domain buyerIntentNoise used by ingest + deterministic pre-score + useDashboardState; unscored cards get a compact pending badge only — never invent Aurora confidence
applies_when: Changing Battlestation feed density, lead ingest qualification, or Aurora hard-reject noise rules
status: active
