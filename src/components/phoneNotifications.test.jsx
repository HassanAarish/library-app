/** "Notifications on this phone" row on the Account tab. */
import { Linking } from "react-native";
import { cleanup, fireEvent, render, screen } from "@testing-library/react-native";
import { I18nProvider } from "@/i18n";
import { getPushToken, pushPermission } from "@/lib/push";
import { pushDevice } from "@/lib/pushDevice";
import PhoneNotifications from "./PhoneNotifications";

let mockAuth;
jest.mock("@/context/AuthContext", () => ({ useAuth: () => mockAuth }));
jest.mock("expo-router", () => ({ router: { push: jest.fn(), back: jest.fn() } }));
jest.mock("@/lib/push", () => ({ pushPermission: jest.fn(), getPushToken: jest.fn() }));
jest.mock("@/lib/pushDevice", () => ({ pushDevice: { register: jest.fn(async () => {}) } }));
jest.mock(
  "lucide-react-native",
  () => new Proxy({ __esModule: true }, { get: (t, k) => (k in t ? t[k] : () => null) }),
);
jest.mock("uniwind", () => ({
  useCSSVariable: (v) => (Array.isArray(v) ? v.map(() => "#000") : "#000"),
  withUniwind: (C) => C,
}));

const show = () =>
  render(
    <I18nProvider>
      <PhoneNotifications />
    </I18nProvider>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth = { preferences: { notifications: { push: true } } };
});
afterEach(cleanup);

test("hidden where push can't work (Expo Go, browser)", async () => {
  pushPermission.mockResolvedValue("unsupported");
  await show();
  expect(screen.queryByText("Notifications on this phone")).toBeNull();
});

test("on", async () => {
  pushPermission.mockResolvedValue("on");
  await show();
  await screen.findByText("On");
  expect(screen.queryByRole("button")).toBeNull();
});

test("not asked yet: Turn on asks, then registers the phone", async () => {
  pushPermission.mockResolvedValueOnce("ask").mockResolvedValue("on");
  getPushToken.mockResolvedValue({ token: "ExponentPushToken[abcdefghijkl]", platform: "android" });
  await show();
  await fireEvent.press(await screen.findByRole("button", { name: "Turn on" }));
  expect(getPushToken).toHaveBeenCalledWith({ ask: true });
  expect(pushDevice.register).toHaveBeenCalled();
  await screen.findByText("On");
});

test("turned off: opens the phone's settings", async () => {
  pushPermission.mockResolvedValue("off");
  const open = jest.spyOn(Linking, "openSettings").mockResolvedValue();
  await show();
  await fireEvent.press(await screen.findByRole("button", { name: "Open phone settings" }));
  expect(open).toHaveBeenCalled();
});

test("turned off on the website: says so, no buttons", async () => {
  mockAuth.preferences.notifications.push = false;
  pushPermission.mockResolvedValue("on");
  await show();
  await screen.findByText("Off in your notification settings on the website.");
  expect(screen.queryByRole("button")).toBeNull();
});
