import { render, screen, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "@/i18n";
import { rentals } from "@/lib/api";
import BookCard from "./BookCard";
import AvailabilityPanel from "./AvailabilityPanel";

let mockAuth = { status: "guest", isAuthenticated: false };

jest.mock("expo-router", () => ({ router: { push: jest.fn(), navigate: jest.fn() } }));
jest.mock("expo-image", () => ({ Image: () => null }));
jest.mock(
  "lucide-react-native",
  () => new Proxy({ __esModule: true }, { get: (t, k) => (k in t ? t[k] : () => null) }),
);
jest.mock("uniwind", () => ({
  useCSSVariable: (v) => (Array.isArray(v) ? v.map(() => "#000") : "#000"),
  withUniwind: (C) => C,
}));
jest.mock("@/context/AuthContext", () => ({ useAuth: () => mockAuth }));
jest.mock("@/realtime/SocketProvider", () => ({
  useSocket: () => ({ connected: true }),
  useWatchBook: () => {},
}));
jest.mock("@/lib/api", () => ({ rentals: { availability: jest.fn() }, books: {}, categories: {} }));

const book = {
  _id: "b1",
  title: "Sapiens",
  author: "Yuval Noah Harari",
  price: 450,
  rentalDays: 14,
};

const show = (ui) =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}
    >
      <I18nProvider>{ui}</I18nProvider>
    </QueryClientProvider>,
  );

const expectNoPaymentWords = () => {
  const text = JSON.stringify(screen.toJSON());
  expect(text).not.toMatch(/Rs |\bprice\b|\bpay|Rent now|Book from|easypaisa/i);
};

describe("book card", () => {
  test("shows the title and author, never the price", async () => {
    await show(<BookCard book={book} />);
    expect(screen.getAllByText("Sapiens").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Yuval Noah Harari").length).toBeGreaterThan(0);
    expectNoPaymentWords();
  });
});

describe("availability (Google Play rule: no renting or payment in the app)", () => {
  const free = { availableNow: true, rentalDays: 14, bookedSlots: [], myBooking: null };

  test("a guest sees it's free and a sign-in button, no rent button", async () => {
    mockAuth = { status: "guest", isAuthenticated: false };
    rentals.availability.mockResolvedValue(free);
    await show(<AvailabilityPanel book={book} />);
    await waitFor(() => expect(screen.getByText("Available now")).toBeTruthy());
    expect(screen.getByRole("button", { name: "Sign in to see your place in line" })).toBeTruthy();
    expectNoPaymentWords();
  });

  test("a signed-in reader without a booking gets no action at all", async () => {
    mockAuth = { status: "authenticated", isAuthenticated: true, user: { _id: "u1" } };
    rentals.availability.mockResolvedValue(free);
    await show(<AvailabilityPanel book={book} />);
    await waitFor(() => expect(screen.getByText("Available now")).toBeTruthy());
    expect(screen.queryByRole("button")).toBeNull();
    expectNoPaymentWords();
  });

  test("an unpaid booking gets a neutral label, and a link to the library", async () => {
    mockAuth = { status: "authenticated", isAuthenticated: true, user: { _id: "u1" } };
    rentals.availability.mockResolvedValue({
      availableNow: false,
      rentalDays: 14,
      bookedSlots: [],
      nextAvailableStart: "2026-12-01T10:00:00Z",
      peopleAhead: 1,
      myBooking: {
        status: "pending_payment",
        placeInLine: 1,
        startDate: "2026-12-01T10:00:00Z",
        endDate: "2026-12-15T10:00:00Z",
      },
    });
    await show(<AvailabilityPanel book={book} />);
    await waitFor(() => expect(screen.getByText("Not confirmed yet")).toBeTruthy());
    expect(screen.getByRole("button", { name: "Go to my library" })).toBeTruthy();
    expectNoPaymentWords();
  });

  test("the app's filters offer no price sorts", () => {
    const source = require("fs").readFileSync("src/app/(tabs)/books.jsx", "utf8");
    expect(source).not.toMatch(/price_asc|price_desc|sortPrice/);
  });
});
