import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/**
 * The page a reader was on, per book, kept on the phone (SecureStore; the
 * browser preview uses localStorage). An index of book ids lets everything be
 * cleared on sign-out, and a book's entry is cleared when its rental ends.
 */
const INDEX = "reader_pages_index";
const keyFor = (bookId) => `reader_page_${bookId}`;

const store =
  Platform.OS === "web"
    ? {
        get: async (k) => globalThis.localStorage?.getItem(k) ?? null,
        set: async (k, v) => globalThis.localStorage?.setItem(k, v),
        remove: async (k) => globalThis.localStorage?.removeItem(k),
      }
    : {
        get: (k) => SecureStore.getItemAsync(k),
        set: (k, v) => SecureStore.setItemAsync(k, v),
        remove: (k) => SecureStore.deleteItemAsync(k),
      };

const readIndex = async () => {
  try {
    return JSON.parse((await store.get(INDEX)) || "[]");
  } catch {
    return [];
  }
};

export const readingPosition = {
  /** The saved page (1 or more), or null. */
  get: async (bookId) => {
    try {
      const page = parseInt(await store.get(keyFor(bookId)), 10);
      return page >= 1 ? page : null;
    } catch {
      return null;
    }
  },

  set: async (bookId, page) => {
    try {
      await store.set(keyFor(bookId), String(page));
      const index = await readIndex();
      if (!index.includes(bookId)) await store.set(INDEX, JSON.stringify([...index, bookId]));
    } catch {
      // not saved: the reader starts at page 1 next time
    }
  },

  clear: async (bookId) => {
    try {
      await store.remove(keyFor(bookId));
      const index = await readIndex();
      if (index.includes(bookId)) {
        await store.set(INDEX, JSON.stringify(index.filter((id) => id !== bookId)));
      }
    } catch {
      // nothing to clear
    }
  },

  /** On sign-out: forget every book's position. */
  clearAll: async () => {
    try {
      const index = await readIndex();
      await Promise.all(index.map((bookId) => store.remove(keyFor(bookId))));
      await store.remove(INDEX);
    } catch {
      // nothing to clear
    }
  },
};
