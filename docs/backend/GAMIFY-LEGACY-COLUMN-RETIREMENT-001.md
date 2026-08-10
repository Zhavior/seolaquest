# GAMIFY-LEGACY-COLUMN-RETIREMENT-001

**Status:** Open — blocked on the retention window in step 3.
**Opened:** 2026-08-10
**Depends on:** the XP reconciliation audit of 2026-08-10 (closed: DECISION MADE — NO BACKFILL REQUIRED).

Remove the four inert legacy progression columns from `User` once it is safe to do so:
`xp`, `level`, `xpRequired`, `xpMultiplier`.

## Why this is a separate ticket

Dropping a column is irreversible in a way that a code change is not. The columns hold the only
surviving record of the pre-Gamify display values, and nothing about the current product needs
them gone — they cost four integers per row and are read by no production code. So the work is
scheduled on evidence, not on tidiness, and the evidence is the checklist below.

The audit that produced this ticket is recorded here rather than in a tracker so it does not get
lost: at the time of the decision the database held 4 users, 3 with non-zero legacy progression,
0 `GamifyProfile` rows and 0 `GamifyXpTransaction` rows. Two of the three non-zero rows were off
the legacy curve entirely (`level: 10, xpRequired: 10000, xpMultiplier: 1.0` where the curve
demands 3829/1.9; and `level: 99, xpRequired: 100` from `scripts/create-user.ts`), so they were
hand-set display values that no rule could have produced. Every `Lead` in the database was NEW or
DISMISSED — zero CONTACTED — so no account had an engagement history that outcomes-only rules
would have paid for. There was nothing to preserve.

## Preconditions

### 1. Confirm all active users have enrolled into `GamifyProfile`

Enrollment happens lazily, from `toShellUser` on any authenticated request
(`GamifyEnrollmentService.ensureEnrolled`). An account that has not signed in since 2026-08-10
therefore still has no profile. That is not a bug, but it means "every active user has a profile"
has to be measured, not assumed.

```sql
SELECT count(*) AS users_without_profile
FROM "User" u
LEFT JOIN "GamifyProfile" p ON p."userId" = u.id
WHERE p."userId" IS NULL;
```

Define "active" before running this — an abandoned trial account will never enroll, and waiting
for it would block the ticket forever. Suggested cut: any user with a session or a `Lead` in the
retention window.

### 2. Confirm no production code reads the legacy fields

```bash
grep -rn "\.xpRequired\|\.xpMultiplier\|user\.xp\b\|user\.level\b" \
  --include="*.ts" --include="*.tsx" app lib features src \
  | grep -v " 2\." | grep -v "\.test\.\|__tests__"
```

Expect hits only where the *DTO field* is named `xp`/`level` while being populated from
`readHunterProgression` — `DashboardUser`, `ProfileHeader`'s "Stored level", and
`useDashboardState`'s `xpPercent`. Those are safe. Any hit that reads the Prisma `User` model
directly is a blocker.

Note the compatibility layer in `lib/auth.ts`: `isMissingOnboardingColumn` and
`compatibleUserColumns` already name all four columns and already tolerate their absence, so the
read path survives the drop. `toCompatibleUser` still synthesises defaults for them, and those
lines come out with the columns.

### 3. Define a retention window

Not yet decided — this is what the ticket is blocked on. The window is the answer to "how long do
we want to be able to reconstruct what a user's HUD said before the migration?" Once it passes,
the values are gone for good.

### 4. Migration

A single `ALTER TABLE "User" DROP COLUMN` for each of the four, plus removal of the fields and
their comment block from `prisma/schema.prisma` and of the corresponding entries in
`lib/auth.ts` (`isMissingOnboardingColumn`, `CompatibleUserRow`, `compatibleUserColumns`,
`toCompatibleUser`).

Snapshot first, into a table rather than a file, so it can be queried without a restore:

```sql
CREATE TABLE "LegacyUserProgressionArchive" AS
SELECT id, xp, level, "xpRequired", "xpMultiplier", now() AS "archivedAt" FROM "User";
```

### 5. Verify rollback and deploy behaviour before execution

- A dropped column cannot be rolled back by redeploying old code — old code reading it will throw
  P2022 against the new schema. Confirm the deployed revision does not read these columns *before*
  the migration runs, not after.
- Prisma migrations run via `npm run db:deploy`; check the generated SQL by hand before applying.
  A drop is not something to discover in a diff after the fact.
- Rehearse on a branch database, including a rollback to the previous application revision, and
  confirm the `lib/auth.ts` compatibility path actually handles the missing columns as intended —
  it has never been exercised against a real database that lacks them.

## Out of scope

No backfill. `GamifyProfile` and `GamifyXpTransaction` are the sole authoritative progression
system; every account starts the outcomes-only ledger at level 1 with zero earned XP. Do not mint
`GamifyXpTransaction` rows from legacy values, do not write `GamifyProfile` progression directly,
do not run `reconcileProfile` for migration purposes, and do not reintroduce the retired
onboarding bonus through this work.
