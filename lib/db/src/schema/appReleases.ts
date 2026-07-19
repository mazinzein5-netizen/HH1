import { pgTable, text, integer, bigint } from "drizzle-orm/pg-core";

/**
 * Latest published app release per platform (currently just Android).
 * The website download section reads this via GET /api/app/latest, so a new
 * EAS build only needs this row updated (founder admin endpoint) — no code
 * edits or redeploys of the API server or website.
 */
export const appReleasesTable = pgTable("app_releases", {
  platform: text("platform").primaryKey(),
  version: text("version").notNull(),
  versionCode: integer("version_code").notNull(),
  apkUrl: text("apk_url").notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});

export type AppReleaseRow = typeof appReleasesTable.$inferSelect;
