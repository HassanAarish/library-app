import { Alert } from "react-native";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router } from "expo-router";
import { I18nProvider } from "@/i18n";
import { auth, twoFactor } from "@/lib/api";
import { googleToken } from "@/lib/socialAuth";
import { CodeInput } from "@/ui";
import LoginScreen from "@/app/(auth)/login";
import TwoFactorScreen from "@/app/(auth)/two-factor";
import SocialButtons from "@/components/auth/SocialButtons";

const mockSignIn = jest.fn(async () => ({ name: "Ayesha Khan" }));
const mockShow = jest.fn();
let mockParams = {};

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => mockParams,
  Redirect: () => null,
}));
// Icons are ES modules Jest cannot load here, and these tests are not about them.
jest.mock(
  "lucide-react-native",
  () => new Proxy({ __esModule: true }, { get: (t, k) => (k in t ? t[k] : () => null) }),
);
jest.mock("uniwind", () => ({
  useCSSVariable: (v) => (Array.isArray(v) ? v.map(() => "#000") : "#000"),
  withUniwind: (C) => C,
}));
jest.mock("@/context/AuthContext", () => ({ useAuth: () => ({ signIn: mockSignIn }) }));
jest.mock("@/ui/Toast", () => ({
  useToast: () => ({ show: mockShow }),
  ToastProvider: ({ children }) => children,
}));
jest.mock("@/lib/api", () => ({
  auth: { login: jest.fn(), social: jest.fn() },
  twoFactor: { verify: jest.fn() },
}));
jest.mock("@/lib/socialAuth", () => ({
  socialProviders: { google: true, facebook: false },
  googleToken: jest.fn(),
  facebookToken: jest.fn(),
}));

const show = (ui) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { gcTime: 0 } } })}>
      <I18nProvider>{ui}</I18nProvider>
    </QueryClientProvider>,
  );

const fillLogin = async () => {
  await fireEvent.changeText(screen.getByLabelText("Email"), " ayesha@t.pk");
  await fireEvent.changeText(screen.getByLabelText("Password"), "Reader123");
  await fireEvent.press(screen.getByRole("button", { name: "Sign in" }));
};

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
});

describe("login", () => {
  test("shows field errors and doesn't call the API on an empty form", async () => {
    await show(<LoginScreen />);
    await fireEvent.press(screen.getByRole("button", { name: "Sign in" }));
    // The first test also pays for the cold start.
    await waitFor(() => expect(screen.getByText("Enter your email address")).toBeTruthy(), {
      timeout: 5000,
    });
    expect(auth.login).not.toHaveBeenCalled();
  });

  test("signs in with the token, trimming the email", async () => {
    auth.login.mockResolvedValue({ raw: { token: "tok" } });
    await show(<LoginScreen />);
    await fillLogin();
    await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith("tok"));
    expect(auth.login.mock.calls[0][0]).toMatchObject({ email: "ayesha@t.pk", authType: "email" });
    expect(mockShow).toHaveBeenCalledWith("Welcome, Ayesha!");
  });

  test("goes to the code step when two-step verification is on", async () => {
    auth.login.mockResolvedValue({ raw: { twoFactorRequired: true, pendingToken: "p1" } });
    await show(<LoginScreen />);
    await fillLogin();
    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith({
        pathname: "/two-factor",
        params: { pendingToken: "p1" },
      }),
    );
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  test("sends an unverified account to the email-code step", async () => {
    auth.login.mockRejectedValue(
      Object.assign(new Error("Please verify your email first"), { status: 403 }),
    );
    await show(<LoginScreen />);
    await fillLogin();
    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith({
        pathname: "/verify-otp",
        params: { email: "ayesha@t.pk", fromLogin: "1" },
      }),
    );
  });

  test("shows the backend's message on other errors", async () => {
    auth.login.mockRejectedValue(new Error("Invalid credentials"));
    await show(<LoginScreen />);
    await fillLogin();
    await waitFor(() =>
      expect(mockShow).toHaveBeenCalledWith("Invalid credentials", { tone: "danger" }),
    );
  });
});

describe("two-step verification", () => {
  test("sends the pending token and code, then signs in", async () => {
    mockParams = { pendingToken: "p1" };
    twoFactor.verify.mockResolvedValue({ raw: { token: "tok2" } });
    await show(<TwoFactorScreen />);
    await fireEvent.changeText(screen.getByLabelText("Authentication code"), "123456");
    await fireEvent.press(screen.getByRole("button", { name: "Verify and sign in" }));
    await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith("tok2"));
    expect(twoFactor.verify).toHaveBeenCalledWith({ pendingToken: "p1", code: "123456" });
  });
});

describe("code input", () => {
  test("keeps digits only, and all six of a pasted code with a space", async () => {
    const onChangeText = jest.fn();
    await show(<CodeInput accessibilityLabel="Code" onChangeText={onChangeText} />);
    await fireEvent.changeText(screen.getByLabelText("Code"), "123 456");
    expect(onChangeText).toHaveBeenCalledWith("123456");
    await fireEvent.changeText(screen.getByLabelText("Code"), "12ab34x5678");
    expect(onChangeText).toHaveBeenLastCalledWith("123456");
  });
});

describe("social sign-in", () => {
  const pressGoogle = async () => {
    await show(<SocialButtons />);
    await fireEvent.press(screen.getByRole("button", { name: "Continue with Google" }));
  };

  test("does nothing when the user cancels", async () => {
    googleToken.mockResolvedValue(null);
    await pressGoogle();
    await waitFor(() => expect(googleToken).toHaveBeenCalled());
    expect(auth.social).not.toHaveBeenCalled();
    expect(mockShow).not.toHaveBeenCalled();
  });

  test("signs in with the backend's token", async () => {
    googleToken.mockResolvedValue("id-token");
    auth.social.mockResolvedValue({ raw: { token: "tok3" } });
    await pressGoogle();
    await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith("tok3"));
    expect(auth.social).toHaveBeenCalledWith({
      provider: "google",
      token: "id-token",
      link: false,
    });
  });

  test("asks before linking to an existing account, and links on yes", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    googleToken.mockResolvedValue("id-token");
    auth.social.mockResolvedValueOnce({ raw: { linkRequired: true, email: "a@t.pk" } });
    await pressGoogle();
    await waitFor(() => expect(alert).toHaveBeenCalled());
    expect(mockSignIn).not.toHaveBeenCalled();

    auth.social.mockResolvedValueOnce({ raw: { token: "tok4" } });
    alert.mock.calls[0][2][1].onPress();
    await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith("tok4"));
    expect(auth.social).toHaveBeenLastCalledWith({
      provider: "google",
      token: "id-token",
      link: true,
    });
  });
});
