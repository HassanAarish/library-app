/** The screen shown when a screen crashes (root layout's ErrorBoundary). */
import { cleanup, fireEvent, render, screen } from "@testing-library/react-native";
import CrashScreen from "./CrashScreen";

jest.mock("expo-router", () => ({ router: { back: jest.fn() } }));
jest.mock(
  "lucide-react-native",
  () => new Proxy({ __esModule: true }, { get: (t, k) => (k in t ? t[k] : () => null) }),
);
jest.mock("uniwind", () => ({
  useCSSVariable: (v) => (Array.isArray(v) ? v.map(() => "#000") : "#000"),
  withUniwind: (C) => C,
}));

afterEach(cleanup);

test("explains and offers to try again (works outside the app's providers)", async () => {
  const retry = jest.fn();
  await render(<CrashScreen retry={retry} />);
  expect(screen.getByText("Something went wrong")).toBeTruthy();
  await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
  expect(retry).toHaveBeenCalled();
});
