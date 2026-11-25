import { useEffect, useState } from "react";

/**
 * Live time left until `until` (e.g. rental end or start date): { left, text, done }.
 * text is "12:34" under an hour, "3h 05m" under 24 hours, "4d 12h" above 24h.
 * Returns null when until is not provided.
 */
export const useCountdown = (until) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!until) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    if (id && typeof id.unref === "function") id.unref();
    return () => clearInterval(id);
  }, [until]);

  if (!until) return null;
  const left = Math.max(0, new Date(until).getTime() - now);
  const totalMinutes = Math.floor(left / 60000);
  const seconds = Math.floor((left % 60000) / 1000);
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);

  let text;
  if (days > 0) {
    text = `${days}d ${totalHours % 24}h`;
  } else if (totalHours > 0) {
    text = `${totalHours}h ${String(totalMinutes % 60).padStart(2, "0")}m`;
  } else {
    text = `${totalMinutes}:${String(seconds).padStart(2, "0")}`;
  }

  return {
    left,
    text,
    done: left === 0,
    days,
    hours: totalHours % 24,
    totalHours,
    minutes: totalMinutes % 60,
    totalMinutes,
    seconds,
  };
};

/**
 * The countdown as translatable text (`text` above is fixed English, kept for
 * tests and logs): "4d 12h", "3h 05m" or "12:34".
 */
export const countdownText = (t, c) => {
  if (!c) return "";
  const pad = (n) => String(n).padStart(2, "0");
  if (c.days > 0) return t("mobile.countdown.daysHours", { days: c.days, hours: c.hours });
  if (c.totalHours > 0) {
    return t("mobile.countdown.hoursMinutes", { hours: c.totalHours, minutes: pad(c.minutes) });
  }
  return t("mobile.countdown.minutesSeconds", { minutes: c.totalMinutes, seconds: pad(c.seconds) });
};

export default useCountdown;
