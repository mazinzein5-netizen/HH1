import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { db, appReleasesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requirePortalSession, getPortalSession } from "./portalAuth";

/**
 * Latest Android release, served to the website download section and the
 * mobile app's update banner. The row lives in the `app_releases` table so a
 * new EAS build only needs a single founder-authenticated PUT (or a DB row
 * update) — no code edits or redeploys. The seed below is only used the very
 * first time, when the table is still empty.
 */
const SEED_ANDROID_RELEASE = {
  platform: "android" as const,
  version: "1.0.1",
  versionCode: 2,
  apkUrl:
    "https://expo.dev/artifacts/eas/p8LbQfNXW_I9rkiYcAmyhKcPzl-8IPGdfgZx62d4W0w.apk",
};

export interface AppRelease {
  platform: "android";
  version: string;
  versionCode: number;
  apkUrl: string;
  updatedAt: number;
}

// In-memory cache so the hot /app/latest path never waits on the database.
let androidRelease: AppRelease = { ...SEED_ANDROID_RELEASE, updatedAt: 0 };

/** Load the persisted release (seeding the table on first ever boot). */
export async function hydrateAppRelease(): Promise<void> {
  try {
    const rows = await db
      .select()
      .from(appReleasesTable)
      .where(eq(appReleasesTable.platform, "android"));
    if (rows.length > 0) {
      const row = rows[0];
      androidRelease = {
        platform: "android",
        version: row.version,
        versionCode: row.versionCode,
        apkUrl: row.apkUrl,
        updatedAt: row.updatedAt,
      };
      logger.info(
        { version: androidRelease.version, versionCode: androidRelease.versionCode },
        "Hydrated Android release from database",
      );
      return;
    }
    const seeded: AppRelease = { ...SEED_ANDROID_RELEASE, updatedAt: Date.now() };
    await db.insert(appReleasesTable).values(seeded);
    androidRelease = seeded;
    logger.info(
      { version: seeded.version },
      "Seeded initial Android release row in database",
    );
  } catch (err) {
    // Keep serving the seed values rather than breaking the download section.
    logger.error({ err }, "Failed to hydrate Android release from database");
  }
}

/** Founder-only guard (mirrors the practitioner admin routes). */
function requireSuperuser(req: Request, res: Response, next: NextFunction): void {
  if (!getPortalSession(req)?.superuser) {
    res.status(403).json({ error: "SUPERUSER_REQUIRED", message: "Founder access only." });
    return;
  }
  next();
}

const SEMVER = /^\d+\.\d+\.\d+$/;
const APK_URL = /^https:\/\/expo\.dev\/artifacts\/eas\/[\w-]+\.apk$/;

const router: IRouter = Router();

router.get("/app/latest", (_req, res) => {
  res.json(androidRelease);
});

router.get("/app/download/android", (_req, res) => {
  res.redirect(302, androidRelease.apkUrl);
});

/**
 * PUT /app/release — founder-only update flow for a new EAS build.
 * Body: { version: "1.0.2", versionCode: 3, apkUrl: "https://expo.dev/artifacts/eas/….apk" }
 * The website and mobile update banner pick up the new values immediately.
 */
router.put("/app/release", requirePortalSession, requireSuperuser, async (req, res) => {
  const { version, versionCode, apkUrl } = (req.body ?? {}) as Record<string, unknown>;
  if (typeof version !== "string" || !SEMVER.test(version.trim())) {
    res.status(400).json({ error: "INVALID_VERSION", message: "version must look like 1.2.3" });
    return;
  }
  if (!Number.isInteger(versionCode) || (versionCode as number) <= 0) {
    res.status(400).json({ error: "INVALID_VERSION_CODE", message: "versionCode must be a positive integer" });
    return;
  }
  if (typeof apkUrl !== "string" || !APK_URL.test(apkUrl.trim())) {
    res.status(400).json({
      error: "INVALID_APK_URL",
      message: "apkUrl must be an https://expo.dev/artifacts/eas/….apk link",
    });
    return;
  }
  if ((versionCode as number) < androidRelease.versionCode) {
    res.status(409).json({
      error: "VERSION_CODE_REGRESSION",
      message: `versionCode ${versionCode} is lower than the current ${androidRelease.versionCode}`,
    });
    return;
  }
  const next: AppRelease = {
    platform: "android",
    version: version.trim(),
    versionCode: versionCode as number,
    apkUrl: apkUrl.trim(),
    updatedAt: Date.now(),
  };
  try {
    await db
      .insert(appReleasesTable)
      .values(next)
      .onConflictDoUpdate({
        target: appReleasesTable.platform,
        set: {
          version: next.version,
          versionCode: next.versionCode,
          apkUrl: next.apkUrl,
          updatedAt: next.updatedAt,
        },
      });
  } catch (err) {
    logger.error({ err }, "Failed to persist Android release update");
    res.status(500).json({ error: "PERSIST_FAILED", message: "Could not save the release." });
    return;
  }
  androidRelease = next;
  logger.info(
    { version: next.version, versionCode: next.versionCode },
    "Android release updated",
  );
  res.json(androidRelease);
});

export default router;
