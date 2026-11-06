import { View } from "react-native";
import { CircleCheck, CircleX } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useI18n } from "@/i18n";
import { useSocket } from "@/realtime/SocketProvider";
import { baseURL } from "@/constants";
import { Card, Icon, PageHeader, Screen, Segmented, Text } from "@/ui";
import PhasePlaceholder from "@/components/PhasePlaceholder";
import SignInPrompt from "@/components/SignInPrompt";

/** Account: profile and sign-out arrive in M1; settings (theme, server status) work now. */
export default function AccountScreen() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const { preference, setPreference } = useTheme();
  const { connected } = useSocket();

  return (
    <Screen>
      <PageHeader title={t("nav.account")} />
      {isAuthenticated ? (
        <PhasePlaceholder phase="M1" title={t("nav.profile")} />
      ) : (
        <SignInPrompt />
      )}

      <Text variant="heading" accessibilityRole="header" className="mt-10 mb-3">
        {t("mobile.settings.title")}
      </Text>
      <Card className="gap-5">
        <View className="gap-2">
          <Text variant="label" weight="medium">
            {t("mobile.settings.appearance")}
          </Text>
          <Segmented
            label={t("mobile.settings.appearance")}
            value={preference}
            onChange={setPreference}
            options={[
              ["system", t("theme.system")],
              ["light", t("theme.light")],
              ["dark", t("theme.dark")],
            ]}
          />
        </View>
        <View className="gap-1">
          <Text variant="label" weight="medium">
            {t("mobile.settings.server")}
          </Text>
          <Text variant="caption" selectable>
            {baseURL}
          </Text>
          <View className="mt-1 flex-row items-center gap-2">
            <Icon
              as={connected ? CircleCheck : CircleX}
              tone={connected ? "success" : "danger"}
              size={16}
            />
            <Text variant="label" className="text-fg-muted">
              {connected ? t("mobile.settings.connected") : t("mobile.settings.disconnected")}
            </Text>
          </View>
        </View>
      </Card>
    </Screen>
  );
}
