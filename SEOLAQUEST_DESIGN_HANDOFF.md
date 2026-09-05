# SEOlaQuest design and mobile handoff

Saved 2026-09-04 (local session date). This document preserves the planning conversation for continuation with a new account.

## Start here

User wants SEOlaQuest to evolve into a premium, user-friendly, gamified product with excellent mobile UX and a matching new landing page. The latest specific preference is a mobile gamification prototype inspired by Nixtio's Dribbble reference below, retaining SEOlaQuest's identity.

IMPORTANT: This conversation produced research and plans only. No new prototype, redesigned landing page, or backend integration was built or verified. The last assistant response offered a separate mobile-first prototype; it did not implement it. The user's immediate request was to save this handoff.

Next concrete work: inspect the actual reference artwork and current rendered app, then build an isolated, clickable responsive prototype of the core journey. Label sample data. Connect real backend contracts only after checking current code and runtime.

## User preferences and working rules

- User has ADHD: make explanations easy to understand and next actions obvious.
- Be candid, realistic, and thoughtful. No invented success, metrics, capabilities, or promises.
- User requested code be entered through Terminal.
- Inspect first, change second, verify third. Preserve unrelated work.
- Aim for premium quality (user calls it "Dribbble 10/10" and "Astra level"); these are aspirations, not verified ratings or a technical specification.
- Favor existing components, native capabilities, installed dependencies, and the smallest complete implementation.
- Read AGENTS.md and relevant nested instructions. Root AGENTS.md requires reading relevant Next.js guides in node_modules/next/dist/docs/ before writing application code.
- Do not assume publishing, commits, migrations, production writes, or native app distribution are authorized by this design conversation.

## Product direction

A modern quest journal: parchment, ink, warm gold, purposeful original illustrations, clear product screens, satisfying verified progression.

Keep the recognizable quest identity, parchment and midnight themes, emblems, levels, and rewards. Refine heavy borders, pervasive uppercase text, competing colors, status chrome, and decorative game elements so the next useful action dominates.

Premium comes from hierarchy, typography, spacing, evidence quality, reliable interactions, and useful feedback. The landing page may be more expressive than the working dashboard.

Core loop:

Discover an opportunity -> inspect evidence -> take a supported action -> backend confirms state -> quest progress updates -> claim an eligible reward -> next useful action.

Do not imply every action earns XP. Keep activity rewards, scan credits, and business outcomes separate. Customer-reported sales do not mint XP in the inspected LeadOutcomeService.

## Reference shortlist

Primary latest user preference:
- Nixtio, Mobile App Gamification UI: https://dribbble.com/shots/27236942-Mobile-App-Gamification-UI

Supporting references:
- Statsy, Neubrutalism Landing Page: https://dribbble.com/shots/19525034-Statsy-com-Neubrutalism-Landing-Page-for-our-analytics-tool
- Outcrowd, ChronoTask Landing Page: https://dribbble.com/shots/25000009-ChronoTask-Landing-Page
- Anna Justina, Gamified Dashboard UI Exploration: https://dribbble.com/shots/27258057-Gamified-Dashboard-UI-Exploration
- Empower Quest: https://dribbble.com/shots/26560779-Empower-Quest-Gamified-Learning-Web-App-UI

Reference status: published descriptions were read. Web extraction did NOT reliably expose the actual shot artwork; attempted image links returned a Dribbble announcement asset. A visual audit still needs to happen. Do not claim pixel-level familiarity with these references.

Use design principles, not copied artwork, exact layouts, wording, or distinctive brand treatments. Build an original SEOlaQuest interpretation.

Relevant skill read in this conversation:
/Users/boydsantos/.codex/skills/dribbble-project-direction/SKILL.md
Project guidance:
/Users/boydsantos/.codex/skills/dribbble-project-direction/references/seolaquest.md
These paths may not exist under a new account; the core guidance is captured here.

## Mobile-first screen plan

Latest proposed bottom navigation: Home / Opportunities / Quests / More.
This superseded an earlier proposal with Keywords in the primary navigation. It is a design recommendation, not implemented or usability-tested. Keywords, scan runs, Guild, deliveries, settings, and billing remain reachable through More.

### Home

Priority order:
1. One next-action card: objective, reason, status, primary button.
2. Compact relevant scan status.
3. Short opportunity queue preview.
4. Active quest with actual requirements and progress.
5. Quiet earned XP/level summary.

Use existing mission derivation before inventing another recommendation system. Situations include missing keywords, ready to scan, scan running, results waiting, claimable quest, and scan failure. Confirm available recovery actions and credit consequences before presenting buttons.

### Opportunity list and detail

- Readable title, original source, context, freshness where available, and saved status.
- Match explanation only when supported by stored data; do not fabricate confidence.
- Detail uses a full screen on phones, optionally a side pane on desktop.
- One primary supported action; secondary actions remain accessible.
- Show related quest contribution only when actual rules support the relationship.
- Show recorded activity and notes where supported.
- Recording "contacted" is distinct from sending a message.
- Preserve filters and scroll position when returning.

### Quests and progress

Each quest explains objective, which action counts, actual progress, reward, status, and next action.
Use existing states such as In progress / Ready to claim / Claimed / expired as supported.
Show pending confirmation explicitly. Celebrate briefly only after confirmed progress or successful reward claim. Respect reduced motion.
Do not promise level unlocks without real entitlement/capability support.

### Mobile usability requirements

- Test 360px, 390px, tablet, and desktop layouts.
- No horizontal overflow or shrunken desktop tables.
- Comfortable 44-48px touch targets; reachable actions.
- Bottom actions clear of navigation, safe areas, and on-screen keyboard.
- Full screens for evidence and writing; sheets for short filters/choices.
- Preserve entered text on recoverable failures; draft persistence is a requirement to verify/build, not confirmed existing functionality.
- Pending, empty, failed, blocked, refunded, expired, and completed states need designs.
- No false success on slow networks; repeated taps must not duplicate operations.
- Keyboard access, focus visibility, screen-reader labels, contrast, and reduced motion.
- First deliverable is a responsive web app prototype, not an iOS/Android binary.
- Offline mutation queues and push notifications are outside the initial scope.

## Backend findings: code evidence, not production certification

These files were inspected during the conversation. Re-read because the workspace is actively changing.

| Capability | Evidence / entry point | Design implication |
|---|---|---|
| Existing mission selection | features/dashboard/lib/deriveMissionControl.ts; features/dashboard/components/DashboardClient.tsx | Reuse next-action logic and existing data flow |
| Durable scan status and history | src/modules/leads/application/ScanRunService.ts; features/scans/actions.ts; app/app/runs/ | Return to recorded scan state; show queued/running/succeeded/failure accurately |
| Failed scan credit refund | ScanRunService.ts includes FAILED_REFUNDED | Show refund only when confirmed, not inferred from any error |
| Recorded opportunity transitions and history | src/modules/leads/application/LeadOutcomeService.ts | Expose supported actions, notes, and history; validate API/UI wiring |
| Quest assignments and progress | src/modules/gamify/GamifyQuestQueryService.ts; features/quests/components/QuestBoard.tsx | Explain actual quest requirements and backend states |
| Reward claims | features/quests/actions.ts; src/modules/gamify/GamifyQuestService.ts | Claim response includes lifetimeXp and level; repeated claim protected; handle expired/incomplete |
| CRM delivery status and recovery | features/deliveries/actions.ts; src/modules/leads/application/CrmDeliveryService.ts | Status and eligible retry; respect paid entitlement and valid destination |
| Scheduled scanning foundation | src/modules/leads/application/ScanSchedulerService.ts | Must verify worker operation, settings, and entitlements before promising automatic monitoring |

LeadOutcomeService inspected behavior: ownership validation, transition policy, idempotency receipt, recorded evidence/notes, and event emission for claims/dismissals. Recorded outcomes are not automatically verified external business results.

Existing shell/UI pointers:
- components/seolaquest/navigation/os-v2/SEOlaQuestShell.tsx
- components/seolaquest/navigation/os-v2/mobile/MobileBottomNav.tsx
- components/seolaquest/navigation/os-v2/sidebar/Sidebar.tsx
- components/seolaquest/navigation/os/shared/navigation.ts
- components/theme/theme-config.ts
- app/globals.css
- features/dashboard/components/layout/MissionControlShell.tsx
- features/dashboard/components/DashboardClient.tsx
- features/quests/components/QuestBoard.tsx

Current theme configuration inspected: parchment, grey, blue; default parchment. Current mobile navigation inspected: HQ / QUESTS / LOG / GUILD / MORE. The planned navigation differs.

## Matching new landing page

Proposed sequence:
1. Clear hero promise plus one dominant product demonstration.
2. Interactive example: Discover -> Review -> Act -> Progress.
3. Evidence detail explaining a useful opportunity.
4. Quest progression and eligible reward example.
5. Actual readable mobile experience.
6. Supported capabilities, pricing/limits, FAQ, and working signup CTA.

Draft headline, not finalized: "Find your next opportunity. Make your next move."

Use shared product components for demonstrations. Clearly label example data. No fabricated customer logos, outcomes, live activity, rankings, or available integrations. Signup promise must match real onboarding.

Do not overwrite an existing landing route blindly. Inspect current root/landing routing, route ownership, and instructions before selecting an isolated preview location.

## What makes this adaptable

- Shared semantic tokens and components across mobile, desktop, themes, and product demonstrations.
- Stable navigation based on user tasks.
- Complete backend-state mapping instead of success-only mockups.
- Flexible long content, missing data, counts, and accessible layouts.
- Presentation changes independent from reward rules, entitlements, and scan behavior.
- New dashboard customization systems are not needed for the first release.

## Commercial discussion (hypotheses, not commitments)

Suggested initial customer hypothesis: solo B2B SaaS founders seeking relevant conversations and a consistent way to act on them. The SEOlaQuest name suggests SEO, while inspected workflows emphasize conversation discovery; clarify the actual promise before final landing copy.

Suggested validation: interview 10 founders, recruit 5 paid pilot users, observe repeat use and renewals, and verify service economics before broad expansion. These interviews/pilots have NOT happened in this conversation.

The million-dollar discussion used illustrative ARR arithmetic, not forecasts: $49/month needs 1,701 accounts; $99 needs 842; $199 needs 419 to exceed $1m ARR. No price was selected. Design quality alone is not proof of commercial viability.

## Safe continuation checklist

1. Read this file and applicable AGENTS.md instructions.
2. Inspect git status, existing plans, relevant current backend docs, and current rendered UI.
3. Inspect Nixtio's actual reference artwork; record applicable principles.
4. Pick an isolated preview location; preserve existing product and unrelated changes.
5. Build mobile Home -> opportunity detail -> quest progress -> reward flow with labeled sample states.
6. Adapt to desktop; create the matching landing demonstration using shared components.
7. Map every visible action/status/value to its backend source; identify gaps explicitly.
8. Verify authenticated integration separately from prototype behavior and production operation.
9. Report what is actually built, tested, connected, and still pending.

At handoff, git status contains extensive pre-existing modifications and untracked files across backend, frontend, ops, schema, and tests. This handoff task owns ONLY this Markdown file. Do not revert, stage, commit, or overwrite other work. Current untracked areas include .agent-plans/, design-reference/, frontend/, backend/, and docs/architecture/GOVERNED_INTELLIGENCE.md; inspect their instructions and content as relevant before implementation.

## Paste into the new account

Read /Users/boydsantos/Desktop/seolaquest/SEOLAQUEST_DESIGN_HANDOFF.md and the applicable AGENTS.md files. Continue the mobile-first SEOlaQuest gamification design inspired by the Nixtio reference, retaining parchment, ink, and gold. Inspect the current app and reference artwork first. Build an isolated, reviewable responsive prototype of Home -> opportunity -> quest progress -> reward, with a matching landing-page direction. Preserve unrelated changes, label sample data, and distinguish prototype behavior from verified backend integration. Keep explanations clear and realistic.
