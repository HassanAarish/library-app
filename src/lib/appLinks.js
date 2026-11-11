/**
 * Website links that open the app (Android App Links, set up in
 * app.config.js) and where each one lands.
 *
 * Emails and shared links point at the website. When the app is installed,
 * links to screens the app has open here instead; everything about paying,
 * plans or passwords stays on the website (Google Play rule, see README), so
 * those paths are never claimed.
 */

/**
 * Paths the app claims, as Android intent-filter data (exact `path` or
 * `pathPrefix`). A JSON file so app.config.js can read the same list.
 */
export { default as APP_LINK_PATHS } from "./appLinkPaths.json";

const SCHEME = "libraryhub:";

/** Pathname and query of an incoming link: a full URL, libraryhub://… or a path. */
const toPath = (link) => {
  if (link.startsWith("/")) return link;
  const url = new URL(link);
  // libraryhub://books/1 puts "books" in the host.
  const pathname = url.protocol === SCHEME ? `/${url.host}${url.pathname}` : url.pathname;
  return `${pathname.replace(/\/{2,}/g, "/")}${url.search}`;
};

/**
 * The app route for a website path. Website-only pages (payments, plans,
 * renting, password reset) map to the nearest app screen.
 */
export const appRouteFor = (link) => {
  try {
    if (typeof link !== "string" || !link) return "/";
    const full = toPath(link);
    const [pathname, search = ""] = full.split("?");
    const path = pathname.replace(/\/+$/, "") || "/";
    const query = search ? `?${search}` : "";

    // A book's rent page: the book page (the app shows availability, not renting).
    const rent = path.match(/^\/books\/([^/]+)\/rent$/);
    if (rent) return `/books/${rent[1]}`;

    switch (path) {
      case "/account":
      case "/account/rentals":
        return "/library"; // the website's account home is the reader's library
      case "/account/notifications":
        return "/notifications";
      case "/account/requests":
        return "/requests?view=mine";
      case "/account/profile":
        return "/account";
      case "/plans":
        return "/";
      default:
        break;
    }
    if (path.startsWith("/account/") || path.startsWith("/reset-password")) return "/";
    return `${path}${query}`;
  } catch {
    // Never throw here: an odd link just opens the home screen.
    return "/";
  }
};
