import { cloneElement, forwardRef, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { useCSSVariable } from "uniwind";
import { useI18n } from "@/i18n";
import { cn } from "./cn";
import Text from "./Text";
import Icon from "./Icon";

/**
 * Label, hint and error around one input. It passes the label and the error
 * state to the input, so screen readers announce them together.
 */
export const Field = ({ label, hint, error, labelAction, children, className }) => (
  <View className={cn("gap-1.5", className)}>
    <View className="flex-row items-center justify-between">
      <Text variant="label" weight="medium">
        {label}
      </Text>
      {labelAction}
    </View>
    {cloneElement(children, {
      accessibilityLabel: label,
      accessibilityHint: error || hint,
      invalid: Boolean(error),
    })}
    {error ? (
      <Text variant="caption" className="text-danger" accessibilityLiveRegion="polite">
        {error}
      </Text>
    ) : hint ? (
      <Text variant="caption">{hint}</Text>
    ) : null}
  </View>
);

/** Text input with the theme's colours; `invalid` shows the error border. */
export const Input = forwardRef(function Input({ invalid, className, end, ...props }, ref) {
  const [placeholder, brand] = useCSSVariable(["--color-fg-subtle", "--color-brand"]);
  const [focused, setFocused] = useState(false);
  const border = invalid ? "border-danger" : focused ? "border-brand" : "border-line-strong";

  return (
    <View className={cn("min-h-12 flex-row items-center rounded-xl border bg-surface", border)}>
      <TextInput
        ref={ref}
        placeholderTextColor={placeholder}
        selectionColor={brand}
        cursorColor={brand}
        {...props}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        className={cn("min-h-12 flex-1 px-4 font-sans text-base text-fg", className)}
      />
      {end}
    </View>
  );
});

/** Password input with a show/hide button. */
export const PasswordInput = forwardRef(function PasswordInput(props, ref) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  return (
    <Input
      ref={ref}
      {...props}
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      end={
        <Pressable
          onPress={() => setVisible((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={visible ? t("auth.hidePassword") : t("auth.showPassword")}
          className="size-12 items-center justify-center"
        >
          <Icon as={visible ? EyeOff : Eye} tone="fg-subtle" size={20} />
        </Pressable>
      }
    />
  );
});

/** Six-digit code: digits only, and Android can offer the code from an SMS or email. */
export const CodeInput = ({ onChangeText, ...props }) => (
  <Input
    {...props}
    keyboardType="number-pad"
    autoComplete="one-time-code"
    textContentType="oneTimeCode"
    // Limited here rather than with maxLength, which would cut a pasted "123 456" short.
    onChangeText={(text) => onChangeText?.(text.replace(/\D/g, "").slice(0, 6))}
    className="text-center text-2xl tracking-widest"
  />
);

/** A line with a word in the middle ("or continue with"). */
export const Divider = ({ label, className }) => (
  <View className={cn("flex-row items-center gap-3", className)}>
    <View className="h-px flex-1 bg-line" />
    <Text variant="caption">{label}</Text>
    <View className="h-px flex-1 bg-line" />
  </View>
);
