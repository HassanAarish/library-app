/**
 * The title and message the app shows for a notification.
 *
 * The backend writes them for the website and email, and payment ones mention
 * amounts in rupees, refunds and paying in time. The app never shows payment
 * wording (Google Play rule, see README), so those types get the app's own
 * neutral text. Everything else uses the backend's words.
 */
export const notificationText = (t, n) => {
  const d = n?.data ?? {};
  switch (n?.type) {
    case "payment.approved":
      return d.userPackageId
        ? { title: t("mobile.notify.planActiveTitle"), message: t("mobile.notify.planActiveBody") }
        : { title: t("mobile.notify.confirmedTitle"), message: t("mobile.notify.confirmedBody") };
    case "payment.rejected":
      return {
        title: t("mobile.notify.notConfirmedTitle"),
        message: t("mobile.notify.notConfirmedBody"),
      };
    case "refund.resolved":
      return {
        title: t("mobile.notify.cancelledUpdateTitle"),
        message: t("mobile.notify.cancelledUpdateBody"),
      };
    case "rental.hold_expired":
      return { title: t("mobile.notify.releasedTitle"), message: t("mobile.notify.releasedBody") };
    case "payment.submitted":
    case "refund.requested":
      return { title: t("mobile.notify.adminTitle"), message: t("mobile.notify.adminBody") };
    default:
      return { title: n?.title ?? "", message: n?.message ?? "" };
  }
};
