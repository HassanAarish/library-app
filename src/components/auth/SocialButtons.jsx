import { useState } from "react";
import { Alert, View } from "react-native";
import { router } from "expo-router";
import { auth } from "@/lib/api";
import { facebookToken, googleToken, socialProviders } from "@/lib/socialAuth";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { Button, Divider, useToast } from "@/ui";

const NAMES = { google: "Google", facebook: "Facebook" };

/**
 * Google + Facebook sign-in (hidden when neither is configured). Handles the
 * backend's three answers: a token (signed in), 2FA required (go to the code
 * step), or "an account with this email exists" (ask before linking).
 */
const SocialButtons = () => {
  const { t } = useI18n();
  const { signIn } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(null);

  const authenticate = async (provider, token, link = false) => {
    setBusy(provider);
    try {
      const { raw } = await auth.social({ provider, token, link });
      if (raw.linkRequired) {
        const name = NAMES[provider];
        Alert.alert(
          t("auth.linkTitle", { provider: name }),
          t("auth.linkBody", { email: raw.email, provider: name }),
          [
            { text: t("auth.usePassword"), style: "cancel" },
            { text: t("auth.linkCta"), onPress: () => authenticate(provider, token, true) },
          ],
        );
      } else if (raw.twoFactorRequired) {
        router.push({ pathname: "/two-factor", params: { pendingToken: raw.pendingToken } });
      } else if (raw.token) {
        const user = await signIn(raw.token);
        if (user) toast.show(t("auth.welcome", { name: user.name?.split(" ")[0] ?? "" }));
      }
    } catch (err) {
      toast.show(err?.message || t("auth.socialFailed"), { tone: "danger" });
    } finally {
      setBusy(null);
    }
  };

  const start = async (provider, getToken) => {
    setBusy(provider);
    try {
      const token = await getToken();
      if (token) await authenticate(provider, token);
    } catch {
      toast.show(t("auth.socialFailed"), { tone: "danger" });
    } finally {
      setBusy(null);
    }
  };

  if (!socialProviders.google && !socialProviders.facebook) return null;

  return (
    <View className="gap-4">
      <Divider label={t("auth.orContinueWith")} />
      {socialProviders.google ? (
        <Button
          variant="secondary"
          loading={busy === "google"}
          disabled={Boolean(busy)}
          onPress={() => start("google", googleToken)}
        >
          {t("mobile.auth.continueWithGoogle")}
        </Button>
      ) : null}
      {socialProviders.facebook ? (
        <Button
          variant="secondary"
          loading={busy === "facebook"}
          disabled={Boolean(busy)}
          onPress={() => start("facebook", facebookToken)}
        >
          {t("auth.continueWithFacebook")}
        </Button>
      ) : null}
    </View>
  );
};

export default SocialButtons;
