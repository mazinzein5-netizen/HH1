import { Router, type IRouter } from "express";

const ANDROID_RELEASE = {
  platform: "android" as const,
  version: "1.0.1",
  versionCode: 2,
  apkUrl:
    "https://expo.dev/artifacts/eas/p8LbQfNXW_I9rkiYcAmyhKcPzl-8IPGdfgZx62d4W0w.apk",
};

const router: IRouter = Router();

router.get("/app/latest", (_req, res) => {
  res.json(ANDROID_RELEASE);
});

router.get("/app/download/android", (_req, res) => {
  res.redirect(302, ANDROID_RELEASE.apkUrl);
});

export default router;
