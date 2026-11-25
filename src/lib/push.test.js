/**
 * Push notifications: registering the phone, sign-out, and opening a tapped
 * push (lib/push.native.js, lib/pushDevice.js, hooks/usePushNotifications.js).
 */
import { act, renderHook } from "@testing-library/react-native";
import * as push from "./push.native";
import { pushDevice } from "./pushDevice";
import { usePushNotifications } from "@/hooks/usePushNotifications";

// --- expo-notifications and expo-constants stand-ins

const mockN = {
  granted: false,
  canAskAgain: true,
  answer: true,
  calls: [],
  listener: null,
  launch: null,
};

jest.mock("expo-notifications", () => ({
  AndroidImportance: { HIGH: 4 },
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async (id) => {
    mockN.calls.push(`channel:${id}`);
  }),
  getPermissionsAsync: jest.fn(async () => {
    mockN.calls.push("check");
    return { granted: mockN.granted, canAskAgain: mockN.canAskAgain };
  }),
  requestPermissionsAsync: jest.fn(async () => {
    mockN.calls.push("ask");
    mockN.granted = mockN.answer;
    return { granted: mockN.answer };
  }),
  getExpoPushTokenAsync: jest.fn(async ({ projectId }) => {
    mockN.calls.push(`token:${projectId}`);
    return { data: "ExponentPushToken[abcdefghijklmnop]" };
  }),
  getLastNotificationResponse: jest.fn(() => mockN.launch),
  clearLastNotificationResponse: jest.fn(() => {
    mockN.launch = null;
  }),
  addNotificationResponseReceivedListener: jest.fn((fn) => {
    mockN.listener = fn;
    return { remove: () => (mockN.listener = null) };
  }),
}));

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    executionEnvironment: "standalone",
    expoConfig: { extra: { eas: { projectId: "proj-1" } } },
  },
}));
const mockConstants = require("expo-constants").default;

// --- app stand-ins

const mockApi = { register: [], unregister: [], read: [] };
jest.mock("@/lib/api", () => ({
  notifications: {
    registerDevice: jest.fn(async (body) => mockApi.register.push(body)),
    unregisterDevice: jest.fn(async (token) => mockApi.unregister.push(token)),
    markRead: jest.fn(async (ids) => mockApi.read.push(...ids)),
  },
}));

let mockAuth;
jest.mock("@/context/AuthContext", () => ({ useAuth: () => mockAuth }));

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
const mockRouter = require("expo-router").router;

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));

const tap = (data) => ({ notification: { request: { content: { data } } } });
const flush = () => act(async () => {});

beforeEach(() => {
  Object.assign(mockN, {
    granted: false,
    canAskAgain: true,
    answer: true,
    calls: [],
    launch: null,
  });
  mockApi.register = [];
  mockApi.unregister = [];
  mockApi.read = [];
  mockRouter.push.mockClear();
  mockConstants.executionEnvironment = "standalone";
  mockAuth = {
    status: "authenticated",
    isAuthenticated: true,
    user: { _id: "u1" },
    preferences: { notifications: { push: true } },
  };
});

describe("getting the phone's push token", () => {
  test("asks once, then gets the token for this project", async () => {
    const device = await push.getPushToken({ ask: true });
    expect(device).toEqual({ token: "ExponentPushToken[abcdefghijklmnop]", platform: "ios" });
    expect(mockN.calls).toEqual(["check", "ask", "token:proj-1"]);
  });

  test("nothing in Expo Go (push needs a development build)", async () => {
    mockConstants.executionEnvironment = "storeClient";
    // push.native.js reads Constants once when it loads: load a fresh copy.
    let expoGo;
    jest.isolateModules(() => {
      expoGo = require("./push.native");
    });
    expect(expoGo.pushSupported).toBe(false);
    expect(await expoGo.getPushToken()).toBeNull();
    expect(mockN.calls).toEqual([]);
  });

  test("no token when the reader says no, and no asking twice", async () => {
    mockN.answer = false;
    expect(await push.getPushToken()).toBeNull();

    mockN.calls = [];
    mockN.canAskAgain = false;
    expect(await push.getPushToken()).toBeNull();
    expect(mockN.calls).toEqual(["check"]);
  });
});

describe("registering with the backend", () => {
  test("a signed-in reader's phone is registered", async () => {
    await renderHook(() => usePushNotifications());
    await flush();
    expect(mockApi.register).toEqual([
      { token: "ExponentPushToken[abcdefghijklmnop]", platform: "ios" },
    ]);
  });

  test("not when the reader turned push off, or for guests", async () => {
    mockAuth.preferences = { notifications: { push: false } };
    await renderHook(() => usePushNotifications());
    await flush();

    mockAuth = { status: "guest", isAuthenticated: false, user: null, preferences: null };
    await renderHook(() => usePushNotifications());
    await flush();

    expect(mockApi.register).toEqual([]);
    expect(mockN.calls).not.toContain("ask");
  });

  test("sign-out removes the phone once, even if it signs out twice", async () => {
    await pushDevice.register({ token: "ExponentPushToken[abcdefghijklmnop]", platform: "ios" });
    await Promise.all([pushDevice.unregister(), pushDevice.unregister()]);
    expect(mockApi.unregister).toEqual(["ExponentPushToken[abcdefghijklmnop]"]);
  });
});

describe("tapping a push", () => {
  const payment = {
    notificationId: "n1",
    type: "payment.approved",
    data: { rentalId: "r1" },
  };

  test("marks it read and opens the matching screen", async () => {
    await renderHook(() => usePushNotifications());
    await act(async () => mockN.listener(tap(payment)));
    expect(mockApi.read).toEqual(["n1"]);
    expect(mockRouter.push).toHaveBeenCalledWith("/library");
  });

  test("a request push opens that request", async () => {
    await renderHook(() => usePushNotifications());
    await act(async () =>
      mockN.listener(
        tap({ notificationId: "n2", type: "book_request.updated", data: { requestId: "q1" } }),
      ),
    );
    expect(mockRouter.push).toHaveBeenCalledWith("/requests/q1");
  });

  test("a tap that launched the app waits for the saved session, then opens", async () => {
    mockN.launch = tap(payment);
    mockAuth = { ...mockAuth, status: "loading", isAuthenticated: false };
    const view = await renderHook(() => usePushNotifications());
    expect(mockRouter.push).not.toHaveBeenCalled();

    mockAuth = { ...mockAuth, status: "authenticated", isAuthenticated: true };
    await view.rerender();
    await flush();
    expect(mockRouter.push).toHaveBeenCalledWith("/library");
    expect(mockRouter.push).toHaveBeenCalledTimes(1);
  });
});
