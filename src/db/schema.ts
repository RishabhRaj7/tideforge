import { index, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Game content (characters, weapons, echoes ...) is produced by scripts/pipeline into versioned JSON and read through
 * src/server/repos (see docs/ARCHITECTURE.md). Postgres holds mutable / user-generated data only.
 */
export const builds = pgTable(
  "builds",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    characterSlug: text("character_slug").notNull(),
    data: jsonb("data").notNull(),
    engineVersion: text("engine_version").notNull().default("2"),
    views: integer("views").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("builds_character_idx").on(t.characterSlug), index("builds_created_idx").on(t.createdAt)],
);

/** "Report a data error / calculation mismatch" submissions. */
export const feedback = pgTable(
  "feedback",
  {
    id: serial("id").primaryKey(),
    kind: text("kind").notNull(), // data-error | calc-mismatch | suggestion
    page: text("page").notNull(),
    message: text("message").notNull(),
    status: text("status").notNull().default("open"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("feedback_status_idx").on(t.status)],
);
