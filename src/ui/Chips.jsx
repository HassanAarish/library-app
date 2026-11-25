import { Pressable, ScrollView } from "react-native";
import { cn } from "./cn";
import Text from "./Text";

/** A sideways-scrolling row of choices: <Chips value onChange options={[[value, label]]} /> */
const Chips = ({ value, onChange, options, label, className }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    keyboardShouldPersistTaps="handled"
    accessibilityLabel={label}
    contentContainerClassName="gap-2"
    className={className}
  >
    {options.map(([v, text]) => {
      const selected = value === v;
      return (
        <Pressable
          key={v || "all"}
          onPress={() => onChange(v)}
          accessibilityRole="button"
          accessibilityState={{ selected }}
          className={cn(
            "min-h-9 justify-center rounded-full border px-3.5",
            selected ? "border-fg bg-fg" : "border-line-strong bg-surface",
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
  </ScrollView>
);

export default Chips;
