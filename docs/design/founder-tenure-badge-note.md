# Product note: a founder / tenure badge, kept away from the ledger

**Raised:** 2026-08-10, out of the XP reconciliation audit.
**Status:** Idea for product to consider. Not scheduled, nothing built.

## The situation that prompted it

When progression moved to the Gamify ledger, every existing account started the outcomes-only
ledger at level 1 with zero earned XP. That is the correct answer — the audit found that the
large legacy numbers had been hand-set rather than earned, and that no account had a single
CONTACTED lead to reconstruct from — but it does mean an early account and an account created
tomorrow look identical on the HUD.

If that bothers us, the answer is to recognise *tenure*, which is a real fact we can prove from
`User.createdAt`, rather than to invent *progression*, which we cannot.

## The one constraint that matters

**It must not touch level, XP, rewards, entitlements, or the ledger.**

The whole point of the migration was that every number the HUD shows can be traced to a
transaction. A badge that quietly grants XP, unlocks a level, or gates a feature puts us straight
back where we started, with the added problem that the fabrication would now have a nice name on
it. Cosmetic means cosmetic: a mark next to the hunter's name, nothing behind it.

Concretely, it should not write `GamifyProfile`, should not create `GamifyXpTransaction` rows,
should not appear in `RewardEligibilityService`, and should not be readable by anything that makes
a gating decision.

## Sketch

Derive it at render time from `User.createdAt` — no new column, no backfill, nothing to keep in
sync. Something like a "Founding Hunter" mark for accounts created before the ledger went live,
shown on the profile header and beside the name in the guild list.

Open questions for product, not engineering: whether tenure is worth marking at all, where the
cutoff sits, and whether it is a one-off founder mark or an ongoing tenure ladder (1 year, 2
years). All of those are cheap to change precisely because nothing depends on the answer.
