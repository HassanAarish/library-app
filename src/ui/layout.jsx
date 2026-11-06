import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCSSVariable, withUniwind } from "uniwind";
import { cn } from "./cn";
import Text from "./Text";
import Icon from "./Icon";
import Button from "./Button";

const StyledSafeArea = withUniwind(SafeAreaView);

/**
 * A screen's frame: theme background, safe areas (notch, gesture bar) and,
 * unless `scroll={false}`, a scroll view with the standard 16px gutter.
 * Tabs add their own bottom bar, so their screens skip the bottom edge.
 */
export const Screen = ({
  children,
  scroll = true,
  edges = ["top"],
  className,
  contentClassName,
}) => (
  <StyledSafeArea edges={edges} className={cn("flex-1 bg-canvas", className)}>
    {scroll ? (
      <ScrollView
        contentContainerClassName={cn("px-4 pb-10 pt-4", contentClassName)}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    ) : (
      <View className={cn("flex-1 px-4 pt-4", contentClassName)}>{children}</View>
    )}
  </StyledSafeArea>
);

/** Screen title row: eyebrow, serif title, description. */
export const PageHeader = ({ eyebrow, title, description, className }) => (
  <View className={cn("mb-6", className)}>
    {eyebrow ? <Text variant="eyebrow">{eyebrow}</Text> : null}
    <Text variant="display" accessibilityRole="header" className="mt-1">
      {title}
    </Text>
    {description ? <Text className="mt-2 text-fg-muted">{description}</Text> : null}
  </View>
);

export const Card = ({ children, className }) => (
  <View className={cn("rounded-card border border-line bg-surface p-4", className)}>
    {children}
  </View>
);

const BADGE_TONES = {
  neutral: "bg-sunken text-fg-muted",
  brand: "bg-brand-soft text-brand",
  gold: "bg-gold-soft text-gold",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};

export const Badge = ({ tone = "neutral", children, className }) => {
  const [bg, fg] = BADGE_TONES[tone].split(" ");
  return (
    <View className={cn("self-start rounded-full px-2.5 py-1", bg, className)}>
      <Text variant="caption" weight="medium" className={fg}>
        {children}
      </Text>
    </View>
  );
};

/** Empty list / nothing-here-yet state, with an optional action. */
export const EmptyState = ({ icon, title, description, action, onAction, className }) => (
  <View
    className={cn(
      "items-center rounded-card border border-dashed border-line-strong px-6 py-12",
      className,
    )}
  >
    {icon ? (
      <View className="mb-4 size-12 items-center justify-center rounded-full bg-sunken">
        <Icon as={icon} tone="fg-subtle" size={22} />
      </View>
    ) : null}
    <Text variant="heading" accessibilityRole="header" className="text-center">
      {title}
    </Text>
    {description ? (
      <Text variant="label" className="mt-1 text-center text-fg-muted">
        {description}
      </Text>
    ) : null}
    {action ? (
      <Button variant="secondary" size="sm" onPress={onAction} className="mt-5">
        {action}
      </Button>
    ) : null}
  </View>
);

/** Centered spinner for whole-screen loading. */
export const Loader = ({ className }) => {
  const color = useCSSVariable("--color-brand");
  return (
    <View className={cn("flex-1 items-center justify-center bg-canvas", className)}>
      <ActivityIndicator size="large" color={color} />
    </View>
  );
};
