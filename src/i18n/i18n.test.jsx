import { renderHook } from "@testing-library/react-native";
import { I18nProvider, useI18n } from "@/i18n";
import en from "./locales/en";

const wrapper = ({ children }) => <I18nProvider>{children}</I18nProvider>;
const setup = async () => (await renderHook(() => useI18n(), { wrapper })).result.current;

describe("i18n", () => {
  test("looks up nested keys and fills {vars}", async () => {
    const { t } = await setup();
    expect(t("mobile.tabs.library")).toBe("Library");
    expect(t("mobile.comingSoon", { phase: "M2" })).toBe("This screen arrives in M2.");
  });

  test("picks the plural form from count", async () => {
    const { t } = await setup();
    expect(t("catalog.results", { count: 1 })).toBe("1 book");
    expect(t("catalog.results", { count: 3 })).toBe("3 books");
  });

  test("a missing key comes back as the key itself", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    expect((await setup()).t("nope.missing")).toBe("nope.missing");
    warn.mockRestore();
  });

  test("prices are whole rupees in the Pakistan format", async () => {
    expect((await setup()).price(1250)).toBe("Rs 1,250");
  });

  test("relative times read naturally", async () => {
    const { relative } = await setup();
    expect(relative(new Date(Date.now() - 3 * 3600 * 1000))).toMatch(/3 hours ago/);
  });

  test("the app's own text never mentions paying (Google Play rule)", async () => {
    expect(JSON.stringify(en.mobile)).not.toMatch(/easypaisa|pay|price|buy|Rs /i);
  });
});
