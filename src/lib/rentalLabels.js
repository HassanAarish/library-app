/**
 * Rental labels for the app. The website's strings talk about payment
 * ("Waiting for payment", "Payment not confirmed", "Not paid in time"), which
 * the app must never show (Google Play rule, see README), so those states get
 * neutral wording here.
 */
const UNPAID_STATUSES = ["pending_payment", "payment_review"];
const UNPAID_REASONS = ["payment_rejected", "payment_timeout"];

export const rentalStatusLabel = (t, status) =>
  UNPAID_STATUSES.includes(status)
    ? t("mobile.availability.notConfirmed")
    : t(`library.status.${status}`);

export const cancelReasonLabel = (t, reason) =>
  UNPAID_REASONS.includes(reason)
    ? t("mobile.library.notConfirmedReason")
    : t(`library.cancelReason.${reason}`);

export const isUnconfirmed = (status) => UNPAID_STATUSES.includes(status);
