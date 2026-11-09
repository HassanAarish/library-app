import { cleanParams, getToken, http, unwrap, unwrapWithMessage, upload } from "@/lib/http";
import { baseURL } from "@/constants";

/**
 * One function per backend endpoint the reader app uses, grouped by area
 * (ported from the website's src/lib/api; admin endpoints stay on the web).
 * Every function returns the response's `data` (or `{ data, message }` where
 * the wording matters) and rejects with an ApiError. See the backend README.
 *
 * Files on React Native are objects: { uri, name, type } (from expo-image-picker).
 */

export const auth = {
  register: (body) => unwrapWithMessage(http.post("/auth/register", body)),
  verifyOtp: (body) => unwrapWithMessage(http.post("/auth/verify-otp", body)),
  resendOtp: (body) => unwrapWithMessage(http.post("/auth/resend-otp", body)),
  // → raw: { token } or { twoFactorRequired, pendingToken }
  login: (body) => unwrapWithMessage(http.post("/auth/login", body)),
  // → raw: { token } | { twoFactorRequired, pendingToken } | { linkRequired, email }
  social: (body) => unwrapWithMessage(http.post("/auth/social", body)),
  forgotPassword: (body) => unwrapWithMessage(http.post("/auth/forgot-password", body)),
  resetPassword: (token, body) =>
    unwrapWithMessage(http.post("/auth/reset-password", body, { params: { token } })),
};

export const twoFactor = {
  setup: () => unwrap(http.post("/twofactor/setup")),
  enable: (code) => unwrapWithMessage(http.post("/twofactor/enable", { code })),
  disable: (code) => unwrapWithMessage(http.post("/twofactor/disable", { code })),
  verify: (body) => unwrapWithMessage(http.post("/twofactor/verify", body)),
};

export const user = {
  profile: () => unwrap(http.get("/user/profile")), // { user, preferences }
  updateProfile: (body) => unwrapWithMessage(http.put("/user/profile-update", body)),
  updatePassword: (body) => unwrapWithMessage(http.patch("/user/password-update", body)),
  setProfilePicture: (profilePicture) =>
    unwrapWithMessage(http.patch("/user/profile-picture", { profilePicture })),
  removeProfilePicture: () => unwrapWithMessage(http.delete("/user/remove-profile-picture")),
};

export const files = {
  // Images only; returns [{ name, url, public_id }]
  uploadImages: (fileList, opts) => {
    const form = new FormData();
    fileList.forEach((f) => form.append("files", f));
    return unwrap(upload("/common/upload", form, opts));
  },
};

export const books = {
  // ?search, category, language, sort (newest|oldest|price_asc|price_desc|title), page, limit
  catalog: (params) => unwrap(http.get("/book", { params: cleanParams(params) })),
  get: (bookId) => unwrap(http.get(`/book/${bookId}`)),
};

// Open Library suggestions for book requests (signed in).
export const lookup = {
  search: (params) => unwrap(http.get("/lookup/books", { params: cleanParams(params) })),
};

export const categories = {
  list: (params) => unwrap(http.get("/category", { params: cleanParams(params) })),
  mine: (params) => unwrap(http.get("/category/mine", { params: cleanParams(params) })),
  suggest: (body) => unwrapWithMessage(http.post("/category", body)),
};

export const rentals = {
  availability: (bookId) => unwrap(http.get(`/rental/availability/${bookId}`)),
  mine: (params) => unwrap(http.get("/rental/mine", { params: cleanParams(params) })),
  get: (rentalId) => unwrap(http.get(`/rental/${rentalId}`)),
  cancel: (rentalId) => unwrapWithMessage(http.post(`/rental/${rentalId}/cancel`)),
  extend: (rentalId) => unwrapWithMessage(http.post(`/rental/${rentalId}/extend`)),
  returnEarly: (rentalId) => unwrapWithMessage(http.post(`/rental/${rentalId}/return`)),
  startNow: (rentalId) => unwrapWithMessage(http.post(`/rental/${rentalId}/start-now`)),
};

export const reader = {
  open: (bookId) => unwrap(http.get(`/reader/${bookId}`)),
  /**
   * A page image source for expo-image: the URL plus the auth header. The
   * reader must render it with cachePolicy="memory" so the watermarked page
   * is never written to the phone's storage (no-download rule).
   */
  pageSource: (bookId, page) => ({
    uri: `${baseURL}/reader/${bookId}/pages/${page}`,
    headers: { Authorization: `Bearer ${getToken()}` },
  }),
};

export const packages = {
  mine: () => unwrap(http.get("/package/mine")), // { creditsAvailable, nextExpiry, packages }
};

export const bookRequests = {
  // ?search, status, language, sort (popular|newest|oldest), page, limit
  list: (params) => unwrap(http.get("/bookrequest", { params: cleanParams(params) })),
  get: (requestId) => unwrap(http.get(`/bookrequest/${requestId}`)),
  mine: (params) => unwrap(http.get("/bookrequest/mine", { params: cleanParams(params) })),
  // → { request, joined, alreadyFollowing? } | { alreadyInLibrary }
  create: (body) => unwrapWithMessage(http.post("/bookrequest", body)),
  follow: (requestId, note) =>
    unwrapWithMessage(http.post(`/bookrequest/${requestId}/follow`, { note })),
  unfollow: (requestId) => unwrapWithMessage(http.delete(`/bookrequest/${requestId}/follow`)),
};

export const notifications = {
  list: (params) => unwrap(http.get("/notification", { params: cleanParams(params) })),
  unreadCount: () => unwrap(http.get("/notification/unread-count")),
  markRead: (ids) => unwrap(http.patch("/notification/read", { ids })),
  markAllRead: () => unwrap(http.patch("/notification/read-all")),
  remove: (notificationId) => unwrap(http.delete(`/notification/${notificationId}`)),
};
