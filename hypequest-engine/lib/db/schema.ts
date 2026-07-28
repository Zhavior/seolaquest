import { pgTable, uuid, text, integer, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";

// Strict Enums for platform and payment tiers
export const platformEnum = pgEnum("platform", ["TWITTER", "REDDIT", "TIKTOK"]);
export const subStatusEnum = pgEnum("subscription_status", ["FREE", "STARTER_HERO", "GUILD_BOSS"]);

// 1. Users Table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  xpPoints: integer("xp_points").default(0).notNull(),
  level: integer("level").default(1).notNull(),
  stripeCustomerId: text("stripe_customer_id").unique(),
  subscriptionStatus: subStatusEnum("subscription_status").default("FREE").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Tracked Keywords Table
export const trackedKeywords = pgTable("tracked_keywords", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  term: text("term").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. Leads (Quests) Table
export const leads = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  externalPostId: text("external_post_id").notNull().unique(), // Prevents duplicate data
  keywordId: uuid("keyword_id").notNull().references(() => trackedKeywords.id, { onDelete: "cascade" }),
  platform: platformEnum("platform").notNull(),
  author: text("author").notNull(),
  content: text("content").notNull(),
  url: text("url").notNull(),
  isClaimed: boolean("is_claimed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
