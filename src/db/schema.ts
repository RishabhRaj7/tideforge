import { pgTable, text, timestamp, jsonb, serial } from "drizzle-orm/pg-core";

export const builds = pgTable("builds", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  characterSlug: text("character_slug").notNull(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
