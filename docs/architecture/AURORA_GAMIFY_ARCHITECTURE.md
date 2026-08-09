# SEOlaQuest Architecture Report: Event Core, Aurora Engine & Gamify OS

**Author:** Principal Software Architect, Staff Engineer & Product Systems Designer  
**Date:** August 7, 2026  
**Status:** Approved Final Production Architecture Specification  
**Target Repository:** SEOlaQuest (`seolaquest-engine`)  

---

## Executive Summary

This architecture document defines the final production design, module boundaries, event contracts, outbox patterns, consumer idempotency receipts, database models, scoring mechanics, anti-farming protections, and implementation roadmap for **SEOlaQuest**'s core intelligence and progression architecture:

1. **EVENT CORE**: Canonical domain event layer featuring a **Lightweight Transactional Outbox Pattern**, consumer-level idempotency receipts (`DomainEventConsumerReceipt`), explicit status semantics (`PENDING`, `PROCESSING`, `PROCESSED`, `FAILED`), `availableAt` backoff mechanics, and strict separation of concerns (`EventFactory`, `EventRegistry`, `EventStore`, `EventProcessor`, `EventDispatcher`).
2. **AURORA ENGINE**: SEOlaQuest's canonical hybrid opportunity intelligence engine. Uses an abstract **Semantic Classifier Adapter Boundary** (`AuroraSemanticClassifier`), combining deterministic signals and AI semantic signals inside a **Canonical Policy Scorer** to generate structured decisions (`score`, `confidence`, `priority`, `recommendedAction`, `reasons`). Enforces bounded AI retry budgets (max 1 retry for transient network errors; zero retries for auth/schema errors), explicit timeouts, and deterministic fallback. Persists full provenance (`classifierVersion`, `deterministicScorerVersion`, `policyVersion`).
3. **GAMIFY OS**: Purpose-driven progression engine. Features dual database-enforced ledgers (`GamifyXpTransaction` and `GamifyReputationTransaction`), an explicit **Reward Eligibility Boundary** (`RewardEligibilityService` for anti-farming), quest contribution idempotency receipts (`GamifyQuestContribution`), Productive Streaks, Achievements, and Seasons. Progression rewards *only* verified user actions—system discovery volume never awards XP.
4. **ANALYTICS DECOUPLING**: Business analytics (`AnalyticsService`) independently consumes canonical domain events and Aurora decisions. Gamify OS metrics are reported separately and are never used to prove customer acquisition success.

This architecture belongs **EXCLUSIVELY** to SEOlaQuest. It operates as a clean **Modular Monolith** inside `src/modules/` using PostgreSQL and existing stack with zero external brokers or microservices.

---

## 1. Current Repository Architecture

Inspection of `seolaquest-engine` confirms:

- **Framework**: Next.js 16.2.12 (App Router with React 19.2.4).
- **Language / Type System**: TypeScript 5 with strict compilation (`"strict": true`).
- **Database & ORM**: PostgreSQL via Prisma ORM `5.10.2` (`prisma/schema.prisma`). Supports `$transaction`, row locking (`SELECT FOR UPDATE`), and PostgreSQL advisory locks (`pg_advisory_xact_lock`).
- **Authentication & Multi-Tenancy**: Clerk (`@clerk/nextjs` 7.6.2), scoped by `userId` (Clerk User ID) as the single-tenant boundary. Automated provisioning in `lib/auth.ts`.
- **Validation**: Zod `3.23.8` used across APIs and system contracts.
- **Logging**: Pino `9.0.0` structured logger in `src/modules/core/infrastructure/logger.ts`.
- **AI Infrastructure**: `@google/genai` 2.15.0 initialized in `lib/gemini.ts`.
- **Modular Monolith Layout**: Code is organized cleanly under `src/modules/`:
  - `src/modules/core/`: Security, logging, errors, API handlers, background queue runner (`DurableJobRepository`).
  - `src/modules/leads/`: `LeadService`, `ScanProviderService`, `ScanRunService`, `CrmDeliveryService`.
  - `src/modules/keywords/`: `KeywordService`.
  - `src/modules/billing/`: `BillingService`, `EntitlementService`, `CreditService`.
  - `src/modules/progression/`: Legacy math functions (`progression.ts`).
  - `src/modules/analytics/`: Business metrics reporting (`AnalyticsService.ts`).

---

## 2. Production-Safety Corrections Incorporated

1. **Transactional Outbox Semantics**:
   - Domain mutations and `DomainEventLog` records (`status = PENDING`) are committed in the exact same database transaction.
   - Consumers run **only after** the transaction commits.
   - `EventProcessor` claims committed events, controls processing lifecycle, retry backoff (`availableAt`), and failure recovery.
   - Explicit responsibility separation:
     - `EventFactory`: Enforces valid envelope construction.
     - `EventRegistry`: Validates registered Zod event schemas.
     - `EventStore`: Persists, queries, and updates outbox events (`PENDING`, `PROCESSING`, `PROCESSED`, `FAILED`).
     - `EventProcessor`: Claims committed events and manages processing lifecycle & retries.
     - `EventDispatcher`: Routes claimed events to registered consumer functions.
2. **Consumer-Level Idempotency (`DomainEventConsumerReceipt`)**:
   - Event-level idempotency is insufficient when an event has multiple consumers.
   - `DomainEventConsumerReceipt` enforces uniqueness on `(eventId, consumerKey)`. If one consumer fails, retries target only that specific consumer without replaying completed consumers.
3. **Explicit Event Lifecycle States**:
   - Outbox event states: `PENDING`, `PROCESSING`, `PROCESSED`, `FAILED`.
   - `availableAt` timestamp enables bounded exponential backoff scheduling directly in PostgreSQL without an external queue.
4. **Aurora Policy Testing**:
   - Unit tests focus on deterministic weighting, score boundaries, threshold behavior, priority mapping, recommended-action mapping, confidence behavior, fallback behavior, and determinism.
5. **Aurora Decision Provenance**:
   - `AuroraDecision` stores full provenance: `finalScore`, `confidence`, `deterministicSignals`, `semanticSignals`, `priority`, `recommendedAction`, `reasons`, `classifierVersion`, `deterministicScorerVersion`, `policyVersion`.
6. **Bounded AI Retry Budget**:
   - Hard timeout budget (e.g. 8s max). Maximum 1 retry for transient infrastructure network errors. Zero retries for schema/validation errors or auth/configuration errors. Deterministic fallback when AI budget is exhausted.
7. **Database-Enforced Gamify Idempotency**:
   - Rewards rely on unique database constraints `(userId, sourceEventId, ruleId)` rather than application-level checks.
8. **Quest Contribution Idempotency**:
   - `GamifyQuestContribution` enforces unique constraint on `(assignmentId, sourceEventId)` to prevent duplicate progress increments.
9. **Event-Driven Domain Integration**:
   - Services emit events into the outbox within their domain transactions. Subsystems consume events asynchronously via Event Core workers without direct synchronous coupling.
10. **Modular Monolith Stack Integrity**:
   - Zero external brokers (no Kafka, Redis, microservices). Uses PostgreSQL SKIP LOCKED durable job execution.

---

## 3. Target Architecture Directional Flow

```
External Opportunity Sources (Reddit, X, Web)
    ↓
Ingestion Pipeline (ScanRunService)
    ↓
DB Transaction: [ Save Lead + EventStore.writeOutbox(opportunity.discovered) ] -> COMMIT
    ↓
Outbox Worker -> EventProcessor.claimBatch()
    ↓
EventDispatcher.dispatch(event) -> Routes to AuroraConsumer
    ↓
[AURORA CORE]
  ├── DeterministicScorer (Recency, Source Quality, Duplicates)
  ├── AuroraSemanticClassifier Adapter (Gemini AI Signals with Bounded Retry/Timeout Budget)
  └── CanonicalPolicyScorer -> Computes Final Score, Confidence & RecommendedAction
    ↓
DB Transaction: [ Save AuroraDecision + EventStore.writeOutbox(aurora.opportunity.evaluated) ] -> COMMIT
    ↓
SEOlaQuest Product View (UI displays Score, Priority, Intent, & Reasons)
    ↓
User Product Action (e.g. User claims & engages opportunity)
    ↓
DB Transaction: [ Update Lead Status + EventStore.writeOutbox(opportunity.engaged) ] -> COMMIT
    ↓
Outbox Worker -> EventProcessor.claimBatch()
    ↓
EventDispatcher.dispatch(event) -> Routes to GamifyConsumer
    ↓
[GAMIFY OS]
  ├── RewardEligibilityService (Check anti-farming, caps, velocity, Aurora score threshold)
  ├── XpLedgerService -> Appends GamifyXpTransaction (unique: userId + eventId + ruleId)
  ├── ReputationService -> Appends GamifyReputationTransaction
  ├── QuestEngine -> Appends GamifyQuestContribution (unique: assignmentId + eventId)
  ├── AchievementEngine -> Evaluates GamifyUserAchievement
  └── ProductiveStreakService -> Logs GamifyStreakLog
    ↓
DB Transaction: [ Commit Gamify Ledger & Progression State + ConsumerReceipt(PROCESSED) ]
    ↓
UI Read Models & Independent Business Analytics
```

---

## 4. Exact Proposed System Boundaries

### A. Event Core (`src/modules/core/events/`)
- **Responsibility**: Envelope construction, Zod schema validation, outbox persistence, consumer-level idempotency receipts, event claiming, and retry-safe dispatching.
- **Envelope Standard (`DomainEvent`)**:
  ```ts
  export interface DomainEvent<T = Record<string, unknown>> {
    id: string; // UUID v4
    type: string; // e.g. "opportunity.discovered"
    version: number; // Schema version (e.g. 1)
    actorId: string; // userId / clerkId
    organizationId?: string; // Tenant/org context
    occurredAt: string; // ISO 8601 string
    source: string; // Originating module (e.g. "leads.scan_service")
    correlationId: string; // Tracing ID across lifecycle
    causationId?: string; // Parent event ID
    idempotencyKey: string; // Unique deduplication key
    payload: T; // Strongly typed payload matching Zod schema
    metadata?: Record<string, unknown>;
  }
  ```
- **Modules**:
  - `EventFactory`: Instantiates and validates domain event envelopes.
  - `EventRegistry`: Registers Zod schemas and maps event types.
  - `EventStore`: Transactional outbox writer and reader for `DomainEventLog`.
  - `EventProcessor`: Claims committed `PENDING` outbox events, manages `availableAt` backoff retries, and tracks `DomainEventConsumerReceipt`s.
  - `EventDispatcher`: Routes claimed events to registered consumer functions.

---

## 5. Database Schema (Prisma Models Proposed)

Add the following tables to `prisma/schema.prisma`:

```prisma
// ==========================================
// EVENT CORE (TRANSACTIONAL OUTBOX & RECEIPTS)
// ==========================================

model DomainEventLog {
  id             String   @id @default(uuid())
  eventId        String   @unique
  type           String
  version        Int      @default(1)
  actorId        String
  source         String
  correlationId  String
  causationId    String?
  idempotencyKey String   @unique
  payload        Json
  metadata       Json?
  status         String   @default("PENDING") // PENDING, PROCESSING, PROCESSED, FAILED
  attempts       Int      @default(0)
  maxAttempts    Int      @default(5)
  availableAt    DateTime @default(now())
  lastErrorCode  String?
  occurredAt     DateTime
  processedAt    DateTime?
  createdAt      DateTime @default(now())

  consumerReceipts DomainEventConsumerReceipt[]

  @@index([status, availableAt, createdAt])
  @@index([actorId, type, occurredAt])
  @@index([correlationId])
}

model DomainEventConsumerReceipt {
  id            String         @id @default(uuid())
  eventId       String
  event         DomainEventLog @relation(fields: [eventId], references: [eventId], onDelete: Cascade)
  consumerKey   String         // e.g. "aurora.evaluator", "gamify.xp_processor"
  status        String         @default("PROCESSED") // PROCESSED, FAILED
  attemptCount  Int            @default(1)
  lastError     String?
  processedAt   DateTime?
  lastAttemptAt DateTime       @default(now())
  createdAt     DateTime       @default(now())

  @@unique([eventId, consumerKey])
  @@index([consumerKey, status])
}

// ==========================================
// AURORA CORE
// ==========================================

model AuroraDecision {
  id                         String   @id @default(uuid())
  opportunityId              String   @unique
  leadId                     String   @unique
  userId                     String
  finalScore                 Int
  confidence                 Float
  priority                   String   // LOW, MEDIUM, HIGH, URGENT
  recommendedAction          String   // IGNORE, WATCH, ENGAGE
  dimensions                 Json     // { relevance, intent, recency, businessFit, sourceQuality }
  reasons                    Json     // Rationale array
  deterministicSignals       Json
  semanticSignals            Json
  policyFlags                Json
  classifierVersion          String
  deterministicScorerVersion String
  policyVersion              String
  createdAt                  DateTime @default(now())
  updatedAt                  DateTime @updatedAt

  lead                       Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
  user                       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  feedback                   AuroraFeedback?

  @@index([userId, finalScore, createdAt])
  @@index([recommendedAction])
}

model AuroraFeedback {
  id                String         @id @default(uuid())
  decisionId        String         @unique
  decision          AuroraDecision @relation(fields: [decisionId], references: [id], onDelete: Cascade)
  opportunityId     String
  userId            String
  outcome           String         // DISMISSED, ENGAGED, REPLIED, CONVERTED
  rewardXp          Int            @default(0)
  perceivedAccuracy  Float?
  notes             String?
  createdAt         DateTime       @default(now())

  @@index([userId, outcome])
}

// ==========================================
// GAMIFY OS
// ==========================================

model GamifyProfile {
  id               String   @id @default(uuid())
  userId           String   @unique
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  level            Int      @default(1)
  lifetimeXp       Int      @default(0)
  currentLevelXp   Int      @default(0)
  xpRequired       Int      @default(100)
  reputationScore  Int      @default(0)
  title            String   @default("Novice Hunter")
  currentStreak    Int      @default(0)
  longestStreak    Int      @default(0)
  lastActiveDay    String?  // YYYY-MM-DD
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  xpTransactions         GamifyXpTransaction[]
  reputationTransactions GamifyReputationTransaction[]
  questAssignments       GamifyQuestAssignment[]
  achievements           GamifyUserAchievement[]
  streakLogs             GamifyStreakLog[]
  seasonProgress         GamifySeasonProgress[]

  @@index([userId])
}

model GamifyXpTransaction {
  id             String        @id @default(uuid())
  profileId      String
  profile        GamifyProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  userId         String
  eventId        String
  ruleId         String
  amount         Int
  reason         String
  idempotencyKey String        @unique
  createdAt      DateTime      @default(now())

  @@unique([userId, eventId, ruleId])
  @@index([userId, createdAt])
  @@index([profileId])
}

model GamifyReputationTransaction {
  id             String        @id @default(uuid())
  profileId      String
  profile        GamifyProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  userId         String
  eventId        String
  ruleId         String
  delta          Int
  reason         String
  idempotencyKey String        @unique
  createdAt      DateTime      @default(now())

  @@unique([userId, eventId, ruleId])
  @@index([userId, createdAt])
  @@index([profileId])
}

model GamifyQuest {
  id           String   @id @default(uuid())
  code         String   @unique
  version      Int      @default(1)
  title        String
  description  String
  type         String   // ONBOARDING, DAILY, WEEKLY, MILESTONE, AURORA
  metric       String   // e.g. "opportunity.engaged"
  target       Int
  rewardXp     Int
  rewardTitle  String?
  enabled      Boolean  @default(true)
  startsAt     DateTime?
  endsAt       DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  assignments  GamifyQuestAssignment[]
}

model GamifyQuestAssignment {
  id          String        @id @default(uuid())
  questId     String
  quest       GamifyQuest   @relation(fields: [questId], references: [id], onDelete: Cascade)
  profileId   String
  profile     GamifyProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  userId      String
  progress    Int           @default(0)
  target      Int
  status      String        @default("IN_PROGRESS") // IN_PROGRESS, COMPLETED, CLAIMED, EXPIRED
  assignedAt  DateTime      @default(now())
  completedAt DateTime?

  contributions GamifyQuestContribution[]

  @@unique([userId, questId])
  @@index([userId, status])
}

model GamifyQuestContribution {
  id           String                @id @default(uuid())
  assignmentId String
  assignment   GamifyQuestAssignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  eventId      String
  increment    Int                   @default(1)
  createdAt    DateTime              @default(now())

  @@unique([assignmentId, eventId])
  @@index([assignmentId])
}

model GamifyAchievement {
  id          String   @id @default(uuid())
  code        String   @unique
  title       String
  description String
  badgeIcon   String
  category    String
  rewardXp    Int      @default(0)
  enabled     Boolean  @default(true)
  createdAt   DateTime @default(now())

  userUnlocks GamifyUserAchievement[]
}

model GamifyUserAchievement {
  id            String            @id @default(uuid())
  achievementId String
  achievement   GamifyAchievement @relation(fields: [achievementId], references: [id], onDelete: Cascade)
  profileId     String
  profile       GamifyProfile     @relation(fields: [profileId], references: [id], onDelete: Cascade)
  userId        String
  unlockedAt    DateTime          @default(now())

  @@unique([userId, achievementId])
  @@index([userId])
}

model GamifyStreakLog {
  id              String        @id @default(uuid())
  profileId       String
  profile         GamifyProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  userId          String
  activityDate    String        // YYYY-MM-DD
  qualifyingEvent String
  createdAt       DateTime      @default(now())

  @@unique([userId, activityDate])
  @@index([userId, activityDate])
}

model GamifySeason {
  id        String   @id @default(uuid())
  code      String   @unique
  name      String
  startsAt  DateTime
  endsAt    DateTime
  active    Boolean  @default(false)
  createdAt DateTime @default(now())

  progress  GamifySeasonProgress[]
}

model GamifySeasonProgress {
  id        String        @id @default(uuid())
  seasonId  String
  season    GamifySeason  @relation(fields: [seasonId], references: [id], onDelete: Cascade)
  profileId String
  profile   GamifyProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  userId    String
  seasonXp  Int           @default(0)
  rank      Int?
  updatedAt DateTime      @updatedAt

  @@unique([userId, seasonId])
  @@index([userId, seasonXp])
}
```

---

## 6. Phase 1 Implementation Scope

**PHASE 1 Scope (EVENT CORE ONLY)**:
1. Update `prisma/schema.prisma` with `DomainEventLog` and `DomainEventConsumerReceipt` models and run `npx prisma db push`.
2. Implement:
   - `src/modules/core/events/DomainEvent.ts`
   - `src/modules/core/events/EventFactory.ts`
   - `src/modules/core/events/EventRegistry.ts`
   - `src/modules/core/events/EventStore.ts`
   - `src/modules/core/events/EventDispatcher.ts`
   - `src/modules/core/events/EventProcessor.ts`
3. Comprehensive Unit Tests in `src/modules/core/events/__tests__/`.
4. Run all 4 quality gate verification checks (`npm run lint`, `npx tsc --noEmit`, `npx vitest run`, `npm run build`).
