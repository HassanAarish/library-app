import { createContext, useCallback, useContext, useMemo } from "react";
import en from "./locales/en";

/**
 * Minimal translation layer, ported from the website (same t() and the same
 * locales/en.js strings). Urdu is added by creating locales/ur.js and listing
 * it in LOCALES; on React Native the RTL switch is I18nManager.forceRTL(),
 * which needs an app reload (done when the language picker lands).
 *
 * Hermes (the app's JS engine) doesn't ship every Intl API on Android, so
 * plurals and relative times fall back to simple English rules.
 */
export const LOCALES = {
  en: { label: "English", dir: "ltr", messages: en, intl: "en-PK" },
  // ur: { label: "اردو", dir: "rtl", messages: ur, intl: "ur-PK" },
};

const DEFAULT_LOCALE = "en";

const lookup = (messages, key) =>
  key.split(".").reduce((node, part) => (node == null ? node : node[part]), messages);

const interpolate = (text, vars) =>
  text.replace(/\{(\w+)\}/g, (match, name) => (vars[name] ?? match).toString());

const pluralRule = (intl, count) => {
  try {
    return new Intl.PluralRules(intl).select(count);
  } catch {
    return count === 1 ? "one" : "other";
  }
};

const I18nContext = createContext(null);

export const I18nProvider = ({ children, locale = DEFAULT_LOCALE }) => {
  const config = LOCALES[locale] ?? LOCALES[DEFAULT_LOCALE];

  /**
   * t("nav.signIn") · t("common.pageOf", { page: 2, total: 9 }) ·
   * t("notifications.unread", { count: 3 }) picks the plural form.
   * Missing keys fall back to English, then to the key itself (easy to spot).
   */
  const t = useCallback(
    (key, vars = {}) => {
      let value = lookup(config.messages, key) ?? lookup(en, key);
      if (value && typeof value === "object" && "other" in value) {
        value = value[pluralRule(config.intl, Number(vars.count ?? 0))] ?? value.other;
      }
      if (typeof value !== "string") {
        if (__DEV__) console.warn(`[i18n] missing key: ${key}`);
        return key;
      }
      return interpolate(value, vars);
    },
    [config],
  );

  const formatters = useMemo(() => {
    const number = (n) => new Intl.NumberFormat(config.intl).format(n);
    return {
      number,
      // Prices are whole rupees.
      price: (n) => t("common.currency", { amount: number(n) }),
      date: (d, opts = { dateStyle: "medium" }) =>
        new Intl.DateTimeFormat(config.intl, { timeZone: "Asia/Karachi", ...opts }).format(
          new Date(d),
        ),
      dateTime: (d) =>
        new Intl.DateTimeFormat(config.intl, {
          timeZone: "Asia/Karachi",
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(d)),
      relative: (d) => {
        const diff = (new Date(d).getTime() - Date.now()) / 1000;
        const steps = [
          [60, "second"],
          [3600, "minute", 60],
          [86400, "hour", 3600],
          [604800, "day", 86400],
          [2629800, "week", 604800],
          [31557600, "month", 2629800],
          [Infinity, "year", 31557600],
        ];
        const [, unit, size = 1] = steps.find(([limit]) => Math.abs(diff) < limit);
        const value = Math.round(diff / size);
        try {
          return new Intl.RelativeTimeFormat(config.intl, { numeric: "auto" }).format(value, unit);
        } catch {
          if (unit === "second") return "just now";
          const n = Math.abs(value);
          const label = `${n} ${unit}${n === 1 ? "" : "s"}`;
          return value < 0 ? `${label} ago` : `in ${label}`;
        }
      },
    };
  }, [config.intl, t]);

  const value = useMemo(
    () => ({ locale, dir: config.dir, t, ...formatters }),
    [locale, config.dir, t, formatters],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
};
