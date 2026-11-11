import { Pressable, View } from "react-native";
import { Check } from "lucide-react-native";
import { cn } from "./cn";
import Icon from "./Icon";
import Text from "./Text";

/**
 * A tick box with its label; the whole row is the touch target.
 * <Checkbox checked={agree} onChange={setAgree} label={t("…")} />
 */
const Checkbox = ({ checked, onChange, label, hint, className }) => (
  <Pressable
    onPress={() => onChange(!checked)}
    accessibilityRole="checkbox"
    aria-checked={checked} // phones and the web (the web ignores accessibilityState)
    accessibilityLabel={label}
    className={cn("min-h-11 flex-row items-start gap-3 py-1", className)}
  >
    <View
      className={cn(
        "mt-0.5 size-6 items-center justify-center rounded-md border-2",
        checked ? "border-brand bg-brand" : "border-line-strong bg-surface",
      )}
    >
      {checked ? <Icon as={Check} tone="on-brand" size={16} /> : null}
    </View>
    <View className="flex-1 gap-0.5">
      <Text weight="medium">{label}</Text>
      {hint ? <Text variant="caption">{hint}</Text> : null}
    </View>
  </Pressable>
);

export default Checkbox;
