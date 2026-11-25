/**
 * Small app-wide flags about the current session.
 *
 * closingAccount: this phone is deleting the account right now, so the
 * server's "account closed" live event (sent to every device) is expected
 * here and the delete screen handles signing out. Cleared on the next sign-in.
 */
export const sessionFlags = { closingAccount: false };
