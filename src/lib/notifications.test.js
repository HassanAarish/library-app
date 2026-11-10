import en from "@/i18n/locales/en";
import { notificationLink } from "./notificationLink";
import { notificationText } from "./notificationText";

const t = (key) => key.split(".").reduce((node, part) => node?.[part], en) ?? key;
const PAYMENT = /\bpay|paid\b|payment|price|\bRs\b|easypaisa|refund|\bbuy|purchase|\brent\b/i;

// What the backend sends for each type (see its services and cron jobs).
const SERVER = {
  "payment.submitted": ["Payment to review", "LH-1: Rs 300 for a rental, Easypaisa TID 1."],
  "payment.approved": ["Payment confirmed", "Your rental of “X” is confirmed."],
  "payment.rejected": ["Payment not confirmed", "We couldn't confirm your payment LH-1."],
  "refund.requested": ["Refund requested", "Send the refund via Easypaisa."],
  "refund.resolved": ["Refund sent", "Rs 300 was sent back."],
  "rental.hold_expired": ["Booking released", "The payment wasn't sent within 30 minutes."],
  "rental.started": ["Your book is ready to read", "Happy reading!"],
  "book_request.updated": ["Update on your book request", "It's coming soon."],
  "book_request.fulfilled": [
    "“Sapiens” is now in the library",
    "The book you asked for, “Sapiens”, has been added. You can rent it now from the catalogue.",
  ],
  "rental.ended": ["Rental ended", "Pay Rs 50 to keep reading."],
};

describe("notification wording (Google Play rule)", () => {
  test.each(Object.entries(SERVER))(
    "%s shows no payment words in the app",
    (type, [title, message]) => {
      const shown = notificationText(t, { type, title, message, data: {} });
      expect(`${shown.title} ${shown.message}`).not.toMatch(PAYMENT);
      expect(shown.title).not.toBe("");
    },
  );

  test("a plan confirmation and a booking confirmation read differently", () => {
    const plan = notificationText(t, { type: "payment.approved", data: { userPackageId: "p" } });
    const booking = notificationText(t, { type: "payment.approved", data: { rentalId: "r" } });
    expect(plan.title).not.toBe(booking.title);
  });

  test("other types keep the backend's words", () => {
    const n = { type: "rental.started", title: "Your book is ready to read", message: "Enjoy" };
    expect(notificationText(t, n)).toEqual({ title: n.title, message: "Enjoy" });
  });

  test("a book that was added keeps its title but not 'rent it now'", () => {
    const [title, message] = SERVER["book_request.fulfilled"];
    const shown = notificationText(t, { type: "book_request.fulfilled", title, message });
    expect(shown).toEqual({ title, message: t("mobile.notify.addedBody") });
  });

  test("'Rental' in a title is not mistaken for 'rent'", () => {
    const n = { type: "rental.ended", title: "Rental ended", message: "Hope you enjoyed it" };
    expect(notificationText(t, n).title).toBe("Rental ended");
  });
});

describe("notification links (app routes, never website-only pages)", () => {
  test("payments, refunds, rentals and plans open the library", () => {
    for (const type of [
      "payment.approved",
      "refund.resolved",
      "rental.started",
      "package.expiring",
    ]) {
      expect(notificationLink({ type, data: { paymentId: "p1" } })).toBe("/library");
    }
  });

  test("requests and categories open the right request screen", () => {
    expect(notificationLink({ type: "book_request.updated", data: { requestId: "r1" } })).toBe(
      "/requests/r1",
    );
    expect(notificationLink({ type: "book_request.fulfilled", data: {} })).toBe(
      "/requests?view=mine",
    );
    expect(notificationLink({ type: "category.approved", data: {} })).toBe("/requests?view=mine");
  });

  test("admin notifications have nowhere to go in the app", () => {
    for (const type of [
      "payment.submitted",
      "refund.requested",
      "book_request.created",
      "category.proposed",
    ]) {
      expect(notificationLink({ type, data: {} })).toBeNull();
    }
  });

  test("no link ever points at a website-only page", () => {
    const types = [...Object.keys(SERVER), "package.expired", "category.rejected", "rental.ended"];
    for (const type of types) {
      expect(
        notificationLink({ type, data: { paymentId: "p", requestId: "r" } }) ?? "",
      ).not.toMatch(/\/account|\/payments|\/plans|\/admin/);
    }
  });
});
