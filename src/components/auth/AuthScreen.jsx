import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import { BackButton, Icon, Logo, Text } from "@/ui";

const StyledSafeArea = withUniwind(SafeAreaView);

/**
 * Frame shared by every sign-in step: back button, logo, title and subtitle,
 * scrolling content that stays above the keyboard.
 */
const AuthScreen = ({ title, subtitle, icon, children, footer }) => {
  return (
    <StyledSafeArea edges={["top", "bottom"]} className="flex-1 bg-canvas">
      <KeyboardAvoidingView
        behavior={Platform.OS === "web" ? undefined : "padding"}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="grow px-4 pb-8 pt-2"
          keyboardShouldPersistTaps="handled"
        >
          <BackButton className="mb-4" />

          {icon ? (
            <View className="mb-5 size-12 items-center justify-center rounded-full bg-brand-soft">
              <Icon as={icon} tone="brand" size={24} />
            </View>
          ) : (
            <Logo className="mb-6" />
          )}
          <Text variant="display" accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? <Text className="mt-2 text-fg-muted">{subtitle}</Text> : null}

          <View className="mt-8 gap-5">{children}</View>
          {footer ? <View className="mt-8 items-center">{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </StyledSafeArea>
  );
};

/** A tappable text link: "Create an account". */
export const TextLink = ({ children, onPress, disabled, className }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="link"
    hitSlop={10}
    className={className}
    style={{ opacity: disabled ? 0.55 : 1 }}
  >
    <Text variant="label" weight="semibold" className="text-brand">
      {children}
    </Text>
  </Pressable>
);

export default AuthScreen;
