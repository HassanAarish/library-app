import { useCSSVariable } from "uniwind";

/**
 * A Lucide icon (same set as the website's react-icons/lu) in a theme colour.
 *   <Icon as={BookOpen} tone="brand" size={20} />
 * tone is a colour token name: fg, fg-muted, fg-subtle, brand, on-brand, gold, danger…
 */
const Icon = ({ as: Glyph, tone = "fg", size = 20, strokeWidth = 2, ...props }) => {
  const color = useCSSVariable(`--color-${tone}`);
  return <Glyph color={color} size={size} strokeWidth={strokeWidth} {...props} />;
};

export default Icon;
