import { APP_LINK_PATHS, appRouteFor } from "./appLinks";

describe("website links opened in the app", () => {
  test.each([
    ["https://libraryhub.pk/books/b1", "/books/b1"],
    ["/books/b1", "/books/b1"],
    ["libraryhub://books/b1", "/books/b1"],
    ["https://libraryhub.pk/requests/r1", "/requests/r1"],
    ["https://libraryhub.pk/requests?sort=newest", "/requests?sort=newest"],
    ["https://libraryhub.pk/read/b1", "/read/b1"],
    ["https://libraryhub.pk/account", "/library"],
    ["https://libraryhub.pk/account/notifications", "/notifications"],
    ["https://libraryhub.pk/account/requests", "/requests?view=mine"],
    ["https://libraryhub.pk/account/profile/", "/account"],
  ])("%s → %s", (link, route) => {
    expect(appRouteFor(link)).toBe(route);
  });

  test("renting, paying and plans never open a payment screen", () => {
    expect(appRouteFor("https://libraryhub.pk/books/b1/rent")).toBe("/books/b1");
    expect(appRouteFor("https://libraryhub.pk/account/payments/p1")).toBe("/");
    expect(appRouteFor("https://libraryhub.pk/plans")).toBe("/");
    expect(appRouteFor("https://libraryhub.pk/reset-password/abc")).toBe("/");
  });

  test("odd input opens home instead of throwing", () => {
    for (const bad of [undefined, "", "::::", "http://", 42]) {
      expect(appRouteFor(bad)).toBe("/");
    }
  });

  test("the app never claims website-only paths", () => {
    const claimed = APP_LINK_PATHS.map((p) => p.path ?? p.pathPrefix);
    for (const p of ["/plans", "/account/payments", "/reset-password", "/admin", "/login"]) {
      expect(claimed.some((c) => p === c || (c.endsWith("/") && p.startsWith(c)))).toBe(false);
    }
  });
});
