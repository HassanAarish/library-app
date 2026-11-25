/**
 * Where a notification takes you in the app, from its type and data ids (see
 * the backend's NOTIFICATION_TYPES). null = nothing to open.
 *
 * The app has no payment or plan screens, so those go to the library. Admin
 * notifications have nowhere to go here: the admin console is on the website.
 */
const ADMIN_TYPES = [
  "payment.submitted",
  "refund.requested",
  "book_request.created",
  "category.proposed",
];

export const notificationLink = (n) => {
  if (!n?.type || ADMIN_TYPES.includes(n.type)) return null;
  const d = n.data ?? {};
  const area = n.type.split(".")[0];

  switch (area) {
    case "payment":
    case "refund":
    case "rental":
    case "package":
      return "/library";
    case "book_request":
      return d.requestId ? `/requests/${d.requestId}` : "/requests?view=mine";
    case "category":
      return "/requests?view=mine";
    default:
      return d.bookId ? `/books/${d.bookId}` : null;
  }
};
