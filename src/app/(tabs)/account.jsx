import { Alert, Platform, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { CircleCheck, CircleX, LogOut } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useI18n } from "@/i18n";
import { useSocket } from "@/realtime/SocketProvider";
import { baseURL, siteURL } from "@/constants";
import { Avatar, Button, Card, Icon, PageHeader, Screen, Segmented, Text } from "@/ui";
import SignInPrompt from "@/components/SignInPrompt";

/** Who's signed in, and sign-out. Editing the profile stays on the website for now. */
const ProfileCard = () => {
  const { t } = useI18n();
  const { user, preferences, signOut } = useAuth();

  const confirmSignOut = () => {
    if (Platform.OS === "web") return signOut(); // Alert buttons don't exist in the browser preview
    return Alert.alert(t("mobile.account.signOutTitle"), t("mobile.account.signOutBody"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("nav.signOut"), style: "destructive", onPress: signOut },
    ]);
  };

  return (
    <Card className="gap-4">
      <View className="flex-row items-center gap-4">
        <Avatar src={preferences?.profilePicture?.url} name={user?.name} size="lg" />
        <View className="min-w-0 flex-1">
          <Text variant="heading" numberOfLines={1}>
            {user?.name}
          </Text>
          <Text variant="label" className="mt-0.5 text-fg-muted" numberOfLines={1}>
            {user?.email}
          </Text>
        </View>
      </View>
      {siteURL ? (
        <View className="gap-2">
          <Text variant="caption">{t("mobile.account.preferencesOnWebsite")}</Text>
          <Button
            variant="secondary"
            size="sm"
            onPress={() => WebBrowser.openBrowserAsync(`${siteURL}/account/profile`)}
          >
            {t("mobile.account.openWebsite")}
          </Button>
        </View>
      ) : null}
      <Button variant="secondary" icon={LogOut} onPress={confirmSignOut}>
        {t("nav.signOut")}
      </Button>
    </Card>
  );
};

/** Account: the signed-in profile or a sign-in prompt, then settings. */
export default function AccountScreen() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const { preference, setPreference } = useTheme();
  const { connected } = useSocket();

  return (
    <Screen>
      <PageHeader title={t("nav.account")} />
      {isAuthenticated ? <ProfileCard /> : <SignInPrompt />}

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
