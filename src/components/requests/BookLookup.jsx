import { useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { Search } from "lucide-react-native";
import { useCSSVariable } from "uniwind";
import { useI18n } from "@/i18n";
import { useDebouncedValue } from "@/hooks/useBooks";
import { useBookLookup } from "@/hooks/useCommunity";
import { Field, Icon, Input, Text } from "@/ui";

/**
 * "Find the book": Open Library suggestions while typing (from 3 letters).
 * Picking one hands its details to `onPick` to fill the form.
 */
const BookLookup = ({ onPick }) => {
  const { t } = useI18n();
  const brand = useCSSVariable("--color-brand");
  const [text, setText] = useState("");
  const [picked, setPicked] = useState(false);
  const query = useDebouncedValue(text);
  const { data = [], isFetching, isSuccess } = useBookLookup(picked ? "" : query);
  const show = !picked && query.trim().length >= 3;

  return (
    <View className="gap-2">
      <Field label={t("requests.lookupLabel")} hint={t("requests.lookupHint")}>
        <Input
          value={text}
          onChangeText={(v) => {
            setText(v);
            setPicked(false);
          }}
          placeholder={t("requests.lookupPlaceholder")}
          autoCorrect={false}
          end={
            <View className="pe-3">
              {isFetching ? (
                <ActivityIndicator size="small" color={brand} />
              ) : (
                <Icon as={Search} tone="fg-subtle" size={18} />
              )}
            </View>
          }
        />
      </Field>

      {show && isSuccess ? (
        data.length ? (
          <View className="overflow-hidden rounded-xl border border-line bg-surface">
            {data.map((item, i) => (
              <Pressable
                key={item.workKey ?? `${item.title}-${i}`}
                onPress={() => {
                  setText(item.title ?? "");
                  setPicked(true);
                  onPick(item);
                }}
                accessibilityRole="button"
                className={i ? "border-t border-line px-4 py-3" : "px-4 py-3"}
              >
                <Text variant="label" weight="semibold" numberOfLines={1}>
                  {item.title}
                </Text>
                <Text variant="caption" numberOfLines={1}>
                  {[item.author, item.publishedYear].filter(Boolean).join(" · ")}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text variant="caption">{t("requests.lookupNone")}</Text>
        )
      ) : null}
    </View>
  );
};

export default BookLookup;
