import { View } from "react-native";
import { useI18n } from "@/i18n";
import { Logo, Screen, Text } from "@/ui";
import PhasePlaceholder from "@/components/PhasePlaceholder";

/** Home: welcome, then new arrivals and the reader's current books (M2). */
export default function HomeScreen() {
  const { t } = useI18n();
  return (
    <Screen>
      <Logo className="mb-8" />
      <Text variant="eyebrow">{t("mobile.home.eyebrow")}</Text>
      <Text variant="display" accessibilityRole="header" className="mt-2">
        {t("mobile.home.title")}
      </Text>
      <Text className="mt-3 text-fg-muted">{t("mobile.home.subtitle")}</Text>
      <View className="mt-8">
        <PhasePlaceholder phase="M2" title={t("home.newArrivals")} />
      </View>
    </Screen>
  );
}
