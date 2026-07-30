import { pgTable, text, jsonb, bigint } from "drizzle-orm/pg-core";

/**
 * Persisted practitioner portal stores, keyed by a stable account key
 * (SHA-256 of the practitioner's normalised email) so the data survives
 * server restarts even though pilot portal accounts get fresh random ids.
 * The whole per-practitioner store (patients, notes, prescriptions,
 * availability slots, booking/consultation settings and bookings) is
 * kept as one JSONB document, mirroring the in-memory pilot structure.
 */
export const practitionerStoresTable = pgTable("practitioner_stores", {
  accountKey: text("account_key").primaryKey(),
  data: jsonb("data").notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});

export type PractitionerStoreRow = typeof practitionerStoresTable.$inferSelect;
