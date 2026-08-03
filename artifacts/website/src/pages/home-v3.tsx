/**
 * HIVE Scroll-World Landing Page (v3)
 *
 * The scroll-world engine is mounted directly by index.html via a vanilla
 * <script> tag (not React). This component exists only so the Wouter router
 * has a valid route component for "/". It renders nothing — the engine's
 * DOM lives in #hive-scroll-world which sits outside React's #root.
 *
 * This avoids any timing issues with lazy loading, useEffect, or React
 * hydration getting in the way of the engine mounting.
 */

export default function HomeV3() {
  return null;
}
