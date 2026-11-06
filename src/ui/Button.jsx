import { ActivityIndicator, Pressable, View } from "react-native";
import { useCSSVariable } from "uniwind";
import { cn } from "./cn";
import Text from "./Text";
import Icon from "./Icon";

const VARIANTS = {
  primary: { box: "bg-brand", text: "text-on-brand", tone: "on-brand" },
  secondary: { box: "border border-line-strong bg-surface", text: "text-fg", tone: "fg" },
  ghost: { box: "bg-transparent", text: "text-fg", tone: "fg" },
  danger: { box: "bg-danger", text: "text-white", tone: "on-brand" },
};

const SIZES = {
  sm: { box: "min-h-9 px-3 gap-1.5 rounded-lg", text: "text-sm", icon: 16 },
  md: { box: "min-h-12 px-4 gap-2 rounded-xl", text: "text-base", icon: 18 },
};

/**
 * <Button onPress icon={BookOpen} variant="secondary" loading>Read now</Button>
 * At least 44px tall (md is 48) so it's an easy touch target.
 */
const Button = ({
  children,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  disabled = false,
  className,
  accessibilityLabel,
}) => {
  const v = VARIANTS[variant];
  const s = SIZES[size];
  const spinner = useCSSVariable(`--color-${v.tone}`);
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => ({ opacity: inactive ? 0.55 : pressed ? 0.8 : 1 })}
      className={cn("flex-row items-center justify-center", v.box, s.box, className)}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinner} />
      ) : icon ? (
        <Icon as={icon} tone={v.tone} size={s.icon} />
      ) : null}
      {typeof children === "string" ? (
        <Text weight="semibold" className={cn(v.text, s.text)}>
          {children}
        </Text>
      ) : (
        <View>{children}</View>
      )}
    </Pressable>
  );
};

export default Button;
