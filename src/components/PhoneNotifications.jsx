import { useCallback, useEffect, useState } from "react";
import { AppState, Linking, View } from "react-native";
import { BellOff, BellRing } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { getPushToken, pushPermission } from "@/lib/push";
import { pushDevice } from "@/lib/pushDevice";
import { Button, Icon, Text } from "@/ui";

/**
 * "Notifications on this phone" in the Account tab's settings: on, not asked
 * yet (Turn on), or turned off (Android only lets the phone's settings turn it
 * back on). Hidden where push can't work (Expo Go, the browser preview).
 * Re-checked when the app comes back from the phone's settings.
 */
const PhoneNotifications = () => {
  const { t } = useI18n();
  const { preferences } = useAuth();
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState(false);
  const offByChoice = preferences?.notifications?.push === false;

  const check = useCallback(() => {
    pushPermission().then(setState);
  }, []);

  useEffect(() => {
    check();
    const sub = AppState.addEventListener("change", (s) => s === "active" && check());
    return () => sub.remove();
  }, [check]);

  if (!state || state === "unsupported") return null;

  const turnOn = async () => {
    setBusy(true);
    const device = await getPushToken({ ask: true });
    if (device) await pushDevice.register(device).catch(() => {});
    setBusy(false);
    check();
  };

  const on = state === "on" && !offByChoice;
  const text = offByChoice
    ? t("mobile.settings.pushOffByYou")
    : state === "on"
      ? t("mobile.settings.pushOn")
      : state === "ask"
        ? t("mobile.settings.pushAsk")
        : t("mobile.settings.pushOff");

  return (
    <View className="gap-2">
      <Text variant="label" weight="medium">
        {t("mobile.settings.pushTitle")}
      </Text>
      <View className="flex-row items-start gap-2">
        <Icon as={on ? BellRing : BellOff} tone={on ? "success" : "fg-subtle"} size={16} />
        <Text variant="label" className="flex-1 text-fg-muted">
          {text}
        </Text>
      </View>
      {!offByChoice && state === "ask" ? (
        <Button variant="secondary" size="sm" onPress={turnOn} loading={busy}>
          {t("mobile.settings.pushTurnOn")}
        </Button>
      ) : null}
      {!offByChoice && state === "off" ? (
        <Button variant="secondary" size="sm" onPress={() => Linking.openSettings()}>
          {t("mobile.settings.pushOpenSettings")}
        </Button>
      ) : null}
    </View>
  );
};

export default PhoneNotifications;
