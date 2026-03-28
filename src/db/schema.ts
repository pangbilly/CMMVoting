import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const acts = pgTable("acts", {
  id: serial("id").primaryKey(),
  nameZh: text("name_zh").notNull(),
  nameEn: text("name_en").notNull(),
  church: text("church").notNull(),
  orderNumber: integer("order_number").notNull(),
  isActive: boolean("is_active").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const votes = pgTable(
  "votes",
  {
    id: serial("id").primaryKey(),
    actId: integer("act_id")
      .references(() => acts.id, { onDelete: "cascade" })
      .notNull(),
    voterId: text("voter_id").notNull(),
    score: integer("score").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [unique("unique_vote").on(table.actId, table.voterId)]
);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export type Act = typeof acts.$inferSelect;
export type Vote = typeof votes.$inferSelect;
export type Setting = typeof settings.$inferSelect;
