import { Text as RNText } from "react-native";
import { cn } from "./cn";

/**
 * All app text goes through this (React Native has no inherited font).
 * variant: display/title/heading (Fraunces serif) | body | label | caption | eyebrow
 * weight: regular | medium | semibold | bold (separate font files on Android)
 *
 * A size or colour in `className` replaces the variant's own: with Uniwind
 * the later of two conflicting classes doesn't reliably win, so the variant's
 * default is left out instead (<Text variant="label" className="text-canvas">).
 */
const VARIANTS = {
  display: { size: "text-3xl/tight", color: "text-fg", font: "font-serif" },
  title: { size: "text-2xl/tight", color: "text-fg", font: "font-serif" },
  heading: { size: "text-lg/snug", color: "text-fg", font: "font-serif" },
  body: { size: "text-base/6", color: "text-fg" },
  label: { size: "text-sm", color: "text-fg" },
  caption: { size: "text-xs", color: "text-fg-subtle" },
  eyebrow: { size: "text-xs", color: "text-gold", extra: "tracking-widest uppercase" },
};

const WEIGHTS = {
  regular: "font-sans",
  medium: "font-sans-medium",
  semibold: "font-sans-semibold",
  bold: "font-sans-bold",
};

const SIZE = /(^|\s)text-(xs|sm|base|lg|[2-9]?xl)(\/\S+)?(\s|$)/;
const ALIGN = /^text-(left|right|center|justify|start|end)$/;
const hasColor = (className = "") =>
  className.split(/\s+/).some((c) => c.startsWith("text-") && !SIZE.test(c) && !ALIGN.test(c));

const Text = ({ variant = "body", weight, className = "", ...props }) => {
  const v = VARIANTS[variant];
  const font = v.font ?? WEIGHTS[weight ?? (variant === "eyebrow" ? "semibold" : "regular")];
  return (
    <RNText
      className={cn(
        font,
        !SIZE.test(className) && v.size,
        !hasColor(className) && v.color,
        v.extra,
        className,
      )}
      {...props}
    />
  );
};

export default Text;
