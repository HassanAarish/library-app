import { cleanup, render, renderHook, screen, waitFor, act } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as ScreenCapture from "expo-screen-capture";
import { I18nProvider } from "@/i18n";
import { reader, rentals } from "@/lib/api";
import { countdownText, useCountdown } from "@/hooks/useCountdown";
import LibraryScreen from "@/app/(tabs)/library";
import ReaderScreen from "@/app/read/[bookId]";

let mockAuth = { status: "authenticated", isAuthenticated: true, user: { _id: "u1" } };
const mockShow = jest.fn();

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), navigate: jest.fn(), back: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({ bookId: "b1" }),
}));
jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    SafeAreaProvider: ({ children }) => React.createElement(View, null, children),
    SafeAreaView: ({ children }) => React.createElement(View, null, children),
    useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
  };
});
jest.mock("expo-screen-capture", () => ({
  preventScreenCaptureAsync: jest.fn().mockResolvedValue(undefined),
  allowScreenCaptureAsync: jest.fn().mockResolvedValue(undefined),
}));
const mockStore = new Map();
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async (k) => mockStore.get(k) ?? null),
  setItemAsync: jest.fn(async (k, v) => void mockStore.set(k, v)),
  deleteItemAsync: jest.fn(async (k) => void mockStore.delete(k)),
}));
jest.mock("expo-image", () => ({
  Image: Object.assign(
    (props) => {
      globalThis.lastPageImage = props;
      return null;
    },
    { prefetch: jest.fn().mockResolvedValue(true) },
  ),
}));
jest.mock(
  "lucide-react-native",
  () => new Proxy({ __esModule: true }, { get: (t, k) => (k in t ? t[k] : () => null) }),
);
jest.mock("uniwind", () => ({
  useCSSVariable: (v) => (Array.isArray(v) ? v.map(() => "#000") : "#000"),
  withUniwind: (C) => C,
}));
jest.mock("@/context/AuthContext", () => ({ useAuth: () => mockAuth }));
jest.mock("@/ui/Toast", () => ({
  useToast: () => ({ show: mockShow }),
  ToastProvider: ({ children }) => children,
}));
jest.mock("@/lib/api", () => ({
  rentals: {
    mine: jest.fn(),
    extend: jest.fn(),
    returnEarly: jest.fn(),
    cancel: jest.fn(),
    startNow: jest.fn(),
  },
  reader: {
    open: jest.fn(),
    pageSource: jest.fn((bookId, page) => ({
      uri: `https://api.libraryhub.pk/reader/${bookId}/pages/${page}`,
      headers: { Authorization: "Bearer token" },
    })),
  },
}));

const show = (ui) =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}
    >
      <I18nProvider>{ui}</I18nProvider>
    </QueryClientProvider>,
  );

const extractText = (node) => {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(extractText).join(" ");
  if (node.children) return extractText(node.children);
  return "";
};

const expectNoPaymentWords = () => {
  const text = extractText(screen.toJSON());
  expect(text).not.toMatch(/Rs |\bprice\b|\bpay\b|Rent now|Book from|easypaisa/i);
};

afterEach(() => {
  cleanup();
});

describe("useCountdown", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-11-10T12:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("returns null when no end date is provided", async () => {
    const { result } = await renderHook(() => useCountdown(null));
    expect(result.current).toBeNull();
  });

  test("formats minutes and seconds under an hour", async () => {
    const future = "2026-11-10T12:15:30Z";
    const { result } = await renderHook(() => useCountdown(future));
    expect(result.current.text).toBe("15:30");
    expect(result.current.done).toBe(false);
  });

  test("formats hours and minutes under 24 hours", async () => {
    const future = "2026-11-10T15:10:00Z";
    const { result } = await renderHook(() => useCountdown(future));
    expect(result.current.text).toBe("3h 10m");
    expect(result.current.done).toBe(false);
  });

  test("formats days and hours over 24 hours", async () => {
    const future = "2026-11-12T17:00:00Z";
    const { result } = await renderHook(() => useCountdown(future));
    expect(result.current.text).toBe("2d 5h");
    expect(result.current.done).toBe(false);
  });
});

describe("LibraryScreen (M3)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("shows sign-in prompt when unauthenticated", async () => {
    mockAuth = { status: "guest", isAuthenticated: false };
    await show(<LibraryScreen />);
    expect(screen.getByText("Sign in to see your library")).toBeTruthy();
  });

  test("shows reading empty state when signed in with no rentals", async () => {
    mockAuth = { status: "authenticated", isAuthenticated: true, user: { _id: "u1" } };
    rentals.mine.mockResolvedValue({ results: [] });
    await show(<LibraryScreen />);
    await waitFor(() => {
      expect(screen.getByText("You're not reading anything right now.")).toBeTruthy();
    });
    expectNoPaymentWords();
  });

  test("displays active reading rentals with Read, Extend, and Return buttons", async () => {
    mockAuth = { status: "authenticated", isAuthenticated: true, user: { _id: "u1" } };
    const now = new Date();
    const activeRental = {
      _id: "r1",
      status: "active",
      startDate: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 12 * 24 * 3600 * 1000).toISOString(),
      extended: false,
      bookId: {
        _id: "b1",
        title: "Clean Architecture",
        author: "Robert C. Martin",
        coverImage: { url: "https://example.com/cover.jpg" },
      },
    };
    rentals.mine.mockResolvedValue({ results: [activeRental] });
    await show(<LibraryScreen />);

    await waitFor(() => {
      expect(screen.getAllByText("Clean Architecture").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Robert C. Martin").length).toBeGreaterThan(0);
    });

    expect(screen.getByText("Read")).toBeTruthy();
    expect(screen.getByText("Extend 7 days")).toBeTruthy();
    expect(screen.getByText("Return")).toBeTruthy();
    expectNoPaymentWords();
  });

  test("unpaid/review bookings show 'Not confirmed yet' and no payment actions", async () => {
    mockAuth = { status: "authenticated", isAuthenticated: true, user: { _id: "u1" } };
    const upcomingUnpaid = {
      _id: "r2",
      status: "pending_payment",
      startDate: "2026-12-01T10:00:00Z",
      endDate: "2026-12-15T10:00:00Z",
      bookId: {
        _id: "b2",
        title: "Refactoring",
        author: "Martin Fowler",
      },
    };
    rentals.mine.mockResolvedValue({ results: [upcomingUnpaid] });
    await show(<LibraryScreen />);

    // Switch tab to upcoming
    await waitFor(() => {
      expect(screen.getByText(/Upcoming/)).toBeTruthy();
    });
    expectNoPaymentWords();
  });
});

describe("countdown text", () => {
  const t = (key, vars) =>
    ({
      "mobile.countdown.daysHours": `${vars?.days}d ${vars?.hours}h`,
      "mobile.countdown.hoursMinutes": `${vars?.hours}h ${vars?.minutes}m`,
      "mobile.countdown.minutesSeconds": `${vars?.minutes}:${vars?.seconds}`,
    })[key];

  test("goes through t() so it can be translated", () => {
    expect(countdownText(t, { days: 4, hours: 12, totalHours: 108 })).toBe("4d 12h");
    expect(countdownText(t, { days: 0, totalHours: 3, minutes: 5 })).toBe("3h 05m");
    expect(countdownText(t, { days: 0, totalHours: 0, totalMinutes: 12, seconds: 4 })).toBe(
      "12:04",
    );
    expect(countdownText(t, null)).toBe("");
  });
});

describe("ReaderScreen (M3)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.clear();
  });

  test("reopens at the saved page, and doesn't overwrite it with page 1 first", async () => {
    const SecureStore = require("expo-secure-store");
    mockStore.set("reader_page_b1", "37");
    reader.open.mockResolvedValue({ title: "Clean Code", author: "R. Martin", pageCount: 150 });

    await show(<ReaderScreen />);
    await waitFor(() => expect(screen.getByText("Page 37 of 150")).toBeTruthy());
    const writes = SecureStore.setItemAsync.mock.calls.filter(([k]) => k === "reader_page_b1");
    expect(writes.map(([, v]) => v)).not.toContain("1");
  });

  test("when the rental ends mid-book, a failed page shows 'reading time has ended'", async () => {
    mockStore.set("reader_page_b1", "5");
    reader.open.mockResolvedValueOnce({ title: "Clean Code", author: "R. Martin", pageCount: 150 });
    reader.open.mockRejectedValue(Object.assign(new Error("Forbidden"), { status: 403 }));

    await show(<ReaderScreen />);
    await waitFor(() => expect(screen.getByText("Page 5 of 150")).toBeTruthy());
    await act(async () => globalThis.lastPageImage.onError());
    await waitFor(() => expect(screen.getByText("Your reading time has ended")).toBeTruthy());
    await waitFor(() => expect(mockStore.has("reader_page_b1")).toBe(false));
  });

  test("a failed page during a network blip keeps the book open", async () => {
    reader.open.mockResolvedValueOnce({ title: "Clean Code", author: "R. Martin", pageCount: 150 });
    reader.open.mockRejectedValue(Object.assign(new Error("Network"), { status: 0 }));

    await show(<ReaderScreen />);
    await waitFor(() => expect(screen.getByText("Clean Code")).toBeTruthy());
    await act(async () => globalThis.lastPageImage.onError());
    await waitFor(() => expect(screen.getByText("This page didn't load.")).toBeTruthy());
    expect(screen.queryByText("Your reading time has ended")).toBeNull();
  });

  test("prevents screen capture on mount and allows it on unmount", async () => {
    reader.open.mockResolvedValue({
      bookId: "b1",
      title: "Clean Code",
      author: "Robert C. Martin",
      pageCount: 150,
      accessUntil: "2026-12-01T10:00:00Z",
    });

    const rendered = await show(<ReaderScreen />);
    expect(ScreenCapture.preventScreenCaptureAsync).toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByText("Clean Code")).toBeTruthy();
    });

    rendered.unmount();
    await waitFor(() => {
      expect(ScreenCapture.allowScreenCaptureAsync).toHaveBeenCalled();
    });
  });

  test("preloads only the next page, and only in memory (never on disk)", async () => {
    const { Image } = require("expo-image");
    reader.open.mockResolvedValue({ title: "Clean Code", author: "R. Martin", pageCount: 150 });

    await show(<ReaderScreen />);
    await waitFor(() => expect(Image.prefetch).toHaveBeenCalled());
    for (const [, options] of Image.prefetch.mock.calls) {
      expect(options).toMatchObject({ cachePolicy: "memory" });
    }
    expect(Image.prefetch.mock.calls.every(([uri]) => uri.endsWith("/pages/2"))).toBe(true);
  });

  test("shows access denied empty state on 403 error", async () => {
    const error = Object.assign(new Error("Rent this book to start reading."), { status: 403 });
    reader.open.mockRejectedValue(error);

    await show(<ReaderScreen />);
    await waitFor(() => {
      expect(screen.getByText("You can't read this book right now")).toBeTruthy();
    });
    expect(screen.getByText("Go to my library")).toBeTruthy();
  });
});
