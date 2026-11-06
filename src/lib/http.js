// The axios instance comes from the default export (axios.create); the
// named `create` isn't part of axios's documented API.
/* eslint-disable import/no-named-as-default-member */
import axios, { isCancel } from "axios";
import { baseURL } from "@/constants";
import { tokenStore } from "./tokenStore";

/**
 * Ported from the website (src/lib/http.js). Differences: the token comes from
 * tokenStore (SecureStore) instead of localStorage, and uploads take React
 * Native file objects ({ uri, name, type }).
 *
 * An API failure with what the UI needs: a readable message (from the
 * backend's `error` field), the HTTP status, and the request id the backend
 * logs, so support can find the exact request in the activity log.
 */
export class ApiError extends Error {
  constructor(message, { status = 0, requestId, data } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.requestId = requestId;
    this.data = data;
  }

  get isNetwork() {
    return this.status === 0;
  }
}

export const getToken = () => tokenStore.get();

// Called on 401s so the app can sign the user out (set by AuthProvider).
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

export const http = axios.create({
  baseURL,
  timeout: 60_000,
  headers: { Accept: "application/json" },
});

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isCancel(error)) return Promise.reject(error);

    const res = error.response;
    if (!res) {
      return Promise.reject(
        new ApiError("Can't reach the server. Check your connection and try again."),
      );
    }

    const body = res.data || {};
    const message =
      body.error ||
      body.message ||
      (res.status >= 500
        ? "Something went wrong on our side. Please try again."
        : "Request failed.");

    if (res.status === 401 && getToken()) onUnauthorized();

    return Promise.reject(
      new ApiError(message, {
        status: res.status,
        requestId: body.requestId || res.headers?.["x-request-id"],
        data: body,
      }),
    );
  },
);

/** Unwraps the backend's `{ success, data }` envelope. */
export const unwrap = (promise) => promise.then((res) => res.data?.data);

/** Keeps `message` alongside `data` for actions whose wording the UI shows. */
export const unwrapWithMessage = (promise) =>
  promise.then((res) => ({ data: res.data?.data, message: res.data?.message, raw: res.data }));

export const upload = (url, formData, { onProgress } = {}) =>
  http.post(url, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: onProgress
      ? (e) => e.total && onProgress(Math.round((e.loaded / e.total) * 100))
      : undefined,
  });

/** Drops empty values so query strings stay clean (?search=&page= → nothing). */
export const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""),
  );
