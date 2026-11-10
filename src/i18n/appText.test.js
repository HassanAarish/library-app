import fs from "fs";
import path from "path";
import en from "./locales/en";
import { cancelReasonLabel, rentalStatusLabel } from "@/lib/rentalLabels";

/**
 * Google Play rule (see README): no payment, price or renting-to-pay wording in
 * the app. Every app screen reuses some website strings, so this checks the
 * text each screen actually uses, not just the app's own `mobile.*` group.
 */
const PAYMENT = /\bpay|paid\b|payment|price|\bRs\b|easypaisa|refund|\bbuy|purchase|rent it/i;

const lookup = (key) => key.split(".").reduce((node, part) => node?.[part], en);
const t = (key) => lookup(key) ?? key;

const screenFiles = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return screenFiles(full);
    return /\.jsx?$/.test(entry.name) ? [full] : [];
  });

const files = [...screenFiles("src/app"), ...screenFiles("src/components")].filter(
  (f) => !/\.test\.jsx?$/.test(f),
);

describe("app text has no payment wording (Google Play rule)", () => {
  test.each(files)("%s", (file) => {
    const source = fs.readFileSync(file, "utf8");
    const keys = [...source.matchAll(/\bt\(\s*["']([\w.]+)["']/g)].map((m) => m[1]);
    const offending = keys.filter((key) => {
      const value = lookup(key);
      return PAYMENT.test(typeof value === "string" ? value : JSON.stringify(value ?? ""));
    });
    expect(offending).toEqual([]);
  });

  test("rental statuses and cancel reasons are reworded for unpaid states", () => {
    for (const status of Object.keys(en.library.status)) {
      expect(rentalStatusLabel(t, status)).not.toMatch(PAYMENT);
    }
    for (const reason of Object.keys(en.library.cancelReason)) {
      expect(cancelReasonLabel(t, reason)).not.toMatch(PAYMENT);
    }
  });
});
