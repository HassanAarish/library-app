import { View } from "react-native";
import { TriangleAlert } from "lucide-react-native";
import { I18nProvider, useI18n } from "@/i18n";
import { Button, Icon, Text } from "@/ui";

const Body = ({ retry }) => {
  const { t } = useI18n();
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-canvas px-8">
      <View className="mb-2 size-14 items-center justify-center rounded-full bg-sunken">
        <Icon as={TriangleAlert} tone="danger" size={26} />
      </View>
      <Text variant="heading" accessibilityRole="header" className="text-center">
        {t("mobile.crash.title")}
      </Text>
      <Text className="text-center text-fg-muted">{t("mobile.crash.body")}</Text>
      <Button onPress={retry} className="mt-4">
        {t("mobile.crash.retry")}
      </Button>
    </View>
  );
};

/**
 * Shown instead of a blank screen when a screen crashes (Expo Router's
 * ErrorBoundary, exported from the root layout). It renders outside the app's
 * providers, so it brings its own I18nProvider; colours follow the phone's
 * theme through the CSS tokens.
 */
const CrashScreen = ({ retry }) => (
  <I18nProvider>
    <Body retry={retry} />
  </I18nProvider>
);

export default CrashScreen;
