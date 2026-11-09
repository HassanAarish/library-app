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

  return { left, text, done: left === 0 };
};

export default useCountdown;
