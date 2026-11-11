/**
 * "Delete your account" (Google Play requires it in the app): what's shown
 * when something is still running, credits, the password, and signing out.
 */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router } from "expo-router";
import { I18nProvider } from "@/i18n";
import { user as userApi } from "@/lib/api";
import { pushDevice } from "@/lib/pushDevice";
import { sessionFlags } from "@/lib/sessionFlags";
import DeleteAccountScreen from "@/app/account/delete";

const mockSignOut = jest.fn(async () => {});
let mockAuth;
const mockShow = jest.fn();

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), navigate: jest.fn(), back: jest.fn(), replace: jest.fn() },
  Redirect: () => null,
}));
jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children }) => React.createElement(View, null, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});
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
  user: { deletionStatus: jest.fn(), requestDeletion: jest.fn() },
}));
jest.mock("@/lib/pushDevice", () => ({ pushDevice: { forget: jest.fn() } }));

const CLEAN = {
  canDelete: true,
  blockers: { reading: 0, upcoming: 0, unconfirmed: 0, refunds: 0 },
  credits: 0,
  graceDays: 14,
};

const show = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { gcTime: 0 } },
        })
      }
    >
      <I18nProvider>
        <DeleteAccountScreen />
      </I18nProvider>
    </QueryClientProvider>,
  );

const submit = () => screen.getByRole("button", { name: "Delete my account" });
const allText = () => JSON.stringify(screen.toJSON());

beforeEach(() => {
  jest.clearAllMocks();
  // On the phone this asks first; here "Delete" is pressed straight away.
  jest
    .spyOn(Alert, "alert")
    .mockImplementation((title, body, buttons) => buttons?.[1]?.onPress?.());
  mockAuth = {
    isAuthenticated: true,
    user: { _id: "u1", authType: "email" },
    signOut: mockSignOut,
  };
});
afterEach(cleanup);

test("explains what happens, and has no payment wording", async () => {
  userApi.deletionStatus.mockResolvedValue(CLEAN);
  await show();
  await screen.findByText(/After 14 days it's deleted for good/);
  expect(screen.getByText(/shown as “Former reader”/)).toBeTruthy();
  expect(allText()).not.toMatch(/\bpay|payment|refund|price|\bRs\b|easypaisa|\brent\b/i);
});

test("something still running blocks it and says what", async () => {
  userApi.deletionStatus.mockResolvedValue({
    ...CLEAN,
    canDelete: false,
    blockers: { reading: 1, upcoming: 2, unconfirmed: 0, refunds: 1 },
  });
  await show();
  await screen.findByText("Finish these first");
  expect(screen.getByText("• You're reading 1 book")).toBeTruthy();
  expect(screen.getByText("• 2 upcoming bookings")).toBeTruthy();
  expect(screen.getByText("• 1 cancelled booking still being settled")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Delete my account" })).toBeNull();
  expect(allText()).not.toMatch(/refund|payment/i);

  await fireEvent.press(screen.getByRole("button", { name: "Go to my library" }));
  expect(router.navigate).toHaveBeenCalledWith("/library");
});

test("needs the password and, with credits left, the tick box", async () => {
  userApi.deletionStatus.mockResolvedValue({ ...CLEAN, credits: 3 });
  await show();
  await screen.findByText("I'm giving up my 3 unused book credits");
  expect(submit()).toBeDisabled();

  await fireEvent.changeText(screen.getByLabelText("Your password"), "Secret123!");
  expect(submit()).toBeDisabled();

  await fireEvent.press(screen.getByRole("checkbox"));
  expect(submit()).toBeEnabled();
});

test("a Google or Facebook account isn't asked for a password", async () => {
  mockAuth.user.authType = "google";
  userApi.deletionStatus.mockResolvedValue(CLEAN);
  await show();
  await waitFor(() => expect(submit()).toBeEnabled());
  expect(screen.queryByLabelText("Your password")).toBeNull();
});

test("deleting signs out on this phone and says when it happens", async () => {
  userApi.deletionStatus.mockResolvedValue({ ...CLEAN, credits: 2 });
  userApi.requestDeletion.mockImplementation(async () => {
    // The server's "account closed" live event arrives meanwhile: ignored here.
    expect(sessionFlags.closingAccount).toBe(true);
    return { scheduledFor: "2026-11-25T10:00:00.000Z" };
  });
  await show();
  await screen.findByText("I'm giving up my 2 unused book credits");
  await fireEvent.press(screen.getByRole("checkbox"));
  await fireEvent.changeText(screen.getByLabelText("Your password"), "Secret123!");
  await fireEvent.press(submit());

  await waitFor(() => expect(mockSignOut).toHaveBeenCalled());
  expect(userApi.requestDeletion).toHaveBeenCalledWith({
    confirm: true,
    password: "Secret123!",
    giveUpCredits: true,
  });
  expect(pushDevice.forget).toHaveBeenCalled();
  expect(mockShow).toHaveBeenCalledWith(expect.stringMatching(/will be deleted on .*2026/));
  expect(router.replace).toHaveBeenCalledWith("/account");
  // Stays set until the next sign-in: the server's live "account closed" event may come later.
  expect(sessionFlags.closingAccount).toBe(true);
});

test("a wrong password shows under the field", async () => {
  sessionFlags.closingAccount = false;
  userApi.deletionStatus.mockResolvedValue(CLEAN);
  userApi.requestDeletion.mockRejectedValue(
    Object.assign(new Error("That password isn't right."), { status: 400 }),
  );
  await show();
  await screen.findByLabelText("Your password");
  await fireEvent.changeText(screen.getByLabelText("Your password"), "nope");
  await fireEvent.press(submit());
  await screen.findByText("That password isn't right.");
  expect(mockSignOut).not.toHaveBeenCalled();
  expect(sessionFlags.closingAccount).toBe(false);
});
