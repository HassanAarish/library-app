import { appRouteFor } from "@/lib/appLinks";

/**
 * Expo Router calls this for every link that opens the app (website links via
 * Android App Links, libraryhub://… links). It maps website paths to app
 * routes; see lib/appLinks.js. Phones only; it must never throw.
 */
export function redirectSystemPath({ path }) {
  return appRouteFor(path);
}
