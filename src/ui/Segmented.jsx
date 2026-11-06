import { Pressable, View } from "react-native";
import { cn } from "./cn";
import Text from "./Text";

/** Pill switcher, like the website's: <Segmented value onChange options={[[value, label]]} /> */
const Segmented = ({ value, onChange, options, label, className }) => (
  <View
    accessibilityRole="radiogroup"
    accessibilityLabel={label}
    className={cn("flex-row gap-1 rounded-xl border border-line bg-surface p-1", className)}
  >
    {options.map(([v, text]) => {
      const selected = value === v;
      return (
        <Pressable
          key={v}
          onPress={() => onChange(v)}
          accessibilityRole="radio"
          accessibilityState={{ selected }}
          className={cn(
            "min-h-10 flex-1 items-center justify-center rounded-lg px-3",
            selected && "bg-fg",
          )}
        >
          <Text
            variant="label"
            weight="medium"
            className={selected ? "text-canvas" : "text-fg-muted"}
          >
            {text}
          </Text>
        </Pressable>
      );
    })}
  </View>
);

export default Segmented;
