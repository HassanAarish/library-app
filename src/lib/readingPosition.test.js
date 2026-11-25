import { readingPosition } from "./readingPosition";

const mockStore = new Map();
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async (k) => mockStore.get(k) ?? null),
  setItemAsync: jest.fn(async (k, v) => void mockStore.set(k, v)),
  deleteItemAsync: jest.fn(async (k) => void mockStore.delete(k)),
}));

beforeEach(() => mockStore.clear());

describe("reading position", () => {
  test("saves and reads back a book's page", async () => {
    await readingPosition.set("b1", 42);
    expect(await readingPosition.get("b1")).toBe(42);
    expect(await readingPosition.get("other")).toBeNull();
  });

  test("clearing one book keeps the others", async () => {
    await readingPosition.set("b1", 3);
    await readingPosition.set("b2", 9);
    await readingPosition.clear("b1");
    expect(await readingPosition.get("b1")).toBeNull();
    expect(await readingPosition.get("b2")).toBe(9);
  });

  test("sign-out clears every book", async () => {
    await readingPosition.set("b1", 3);
    await readingPosition.set("b2", 9);
    await readingPosition.clearAll();
    expect(mockStore.size).toBe(0);
  });

  test("a broken keystore never throws", async () => {
    const SecureStore = require("expo-secure-store");
    SecureStore.getItemAsync.mockRejectedValueOnce(new Error("locked"));
    expect(await readingPosition.get("b1")).toBeNull();
  });
});
