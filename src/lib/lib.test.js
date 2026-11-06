import * as SecureStore from "expo-secure-store";
import { ApiError, cleanParams, http } from "./http";
import { tokenStore } from "./tokenStore";

jest.mock("expo-secure-store", () => {
  const store = new Map();
  return {
    getItemAsync: jest.fn(async (k) => store.get(k) ?? null),
    setItemAsync: jest.fn(async (k, v) => void store.set(k, v)),
    deleteItemAsync: jest.fn(async (k) => void store.delete(k)),
  };
});

describe("tokenStore", () => {
  test("keeps the token in SecureStore and in memory", async () => {
    await tokenStore.set("abc");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("token", "abc");
    expect(tokenStore.get()).toBe("abc");
    expect(await tokenStore.load()).toBe("abc");

    await tokenStore.set(null);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("token");
    expect(tokenStore.get()).toBeNull();
  });

  test("an unreadable keystore starts signed out", async () => {
    SecureStore.getItemAsync.mockRejectedValueOnce(new Error("keystore locked"));
    expect(await tokenStore.load()).toBeNull();
  });
});

describe("http", () => {
  test("sends the saved token as a Bearer header", async () => {
    await tokenStore.set("tok-1");
    const config = await http.interceptors.request.handlers[0].fulfilled({ headers: {} });
    expect(config.headers.Authorization).toBe("Bearer tok-1");
    await tokenStore.set(null);
  });

  test("turns failures into ApiError with the backend's message", async () => {
    const onRejected = http.interceptors.response.handlers[0].rejected;
    const err = await onRejected({
      response: { status: 409, data: { error: "Already booked", requestId: "r1" }, headers: {} },
    }).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ message: "Already booked", status: 409, requestId: "r1" });

    const offline = await onRejected({}).catch((e) => e);
    expect(offline.isNetwork).toBe(true);
  });

  test("cleanParams drops empty values", () => {
    expect(cleanParams({ search: "", page: 2, sort: null, q: undefined })).toEqual({ page: 2 });
  });
});
