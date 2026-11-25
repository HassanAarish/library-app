import { useState } from "react";
import { Alert, Platform, View } from "react-native";
import { Redirect, router } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CircleAlert } from "lucide-react-native";
import { user as userApi } from "@/lib/api";
import { qk } from "@/lib/queryClient";
import { pushDevice } from "@/lib/pushDevice";
import { sessionFlags } from "@/lib/sessionFlags";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import {
  Button,
  Card,
  Checkbox,
  ErrorState,
  Field,
  Icon,
  Loader,
  PasswordInput,
  Text,
  useToast,
} from "@/ui";
import StackPage from "@/components/StackPage";

const BLOCKERS = ["reading", "upcoming", "unconfirmed", "refunds"];
const DAY = 86_400_000;

/**
 * Delete my account (Google Play requires this inside the app). The backend
 * decides what's allowed: nothing may still be running, unused credits must
 * be given up, and password accounts confirm with their password. The account
 * closes now and is deleted after the grace period unless they sign in again.
 */
export default function DeleteAccountScreen() {
  const { t, date } = useI18n();
  const toast = useToast();
  const { isAuthenticated, user, signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [giveUp, setGiveUp] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  // Email accounts have a password; Google and Facebook ones don’t.
  const needsPassword = user?.authType === "email";

  const status = useQuery({
    queryKey: qk.deletionStatus,
    queryFn: userApi.deletionStatus,
    enabled: isAuthenticated,
    staleTime: 0,
  });

  const remove = useMutation({
    onMutate: () => {
      sessionFlags.closingAccount = true;
    },
    mutationFn: () =>
      userApi.requestDeletion({
        confirm: true,
        ...(needsPassword && { password }),
        ...(status.data?.credits > 0 && { giveUpCredits: true }),
      }),
    onSuccess: async ({ scheduledFor }) => {
      // The server ended every session and removed this phone from push.
      pushDevice.forget();
      await signOut();
      toast.show(t("mobile.deleteAccount.done", { date: date(scheduledFor) }));
      router.replace("/account");
      // The flag stays set until the next sign-in: the server's "account
      // closed" live event can arrive after the reply and mustn't replace this.
    },
    onError: (err) => {
      sessionFlags.closingAccount = false;
      // A wrong password is a 400 (a 401 would mean the session ended).
      if (err.status === 400 && needsPassword) setPasswordError(err.message);
      else toast.show(err.message, { tone: "danger" });
      status.refetch();
    },
  });

  if (!isAuthenticated) return <Redirect href="/account" />;

  const data = status.data;
  const days = data?.graceDays ?? 14;
  const blockers = data ? BLOCKERS.filter((k) => data.blockers?.[k] > 0) : [];
  const ready =
    data?.canDelete && (!data.credits || giveUp) && (!needsPassword || password.length > 0);

  const confirm = () => {
    const when = date(new Date(Date.now() + days * DAY));
    if (Platform.OS === "web") return remove.mutate(); // no Alert buttons in the browser preview
    return Alert.alert(
      t("mobile.deleteAccount.confirmTitle"),
      t("mobile.deleteAccount.confirmBody", { date: when }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("mobile.deleteAccount.submit"),
          style: "destructive",
          onPress: () => remove.mutate(),
        },
      ],
    );
  };

  return (
    <StackPage>
      <Text variant="display" accessibilityRole="header">
        {t("mobile.deleteAccount.title")}
      </Text>
      <Text className="mt-2">{t("mobile.deleteAccount.intro", { days })}</Text>
      <Text className="mt-2 text-fg-muted">{t("mobile.deleteAccount.changeMind")}</Text>

      <Card className="mt-6 gap-4">
        <View className="gap-1">
          <Text weight="semibold">{t("mobile.deleteAccount.whatGoes")}</Text>
          <Text variant="label" className="text-fg-muted">
            {t("mobile.deleteAccount.whatGoesBody")}
          </Text>
        </View>
        <View className="gap-1">
          <Text weight="semibold">{t("mobile.deleteAccount.whatStays")}</Text>
          <Text variant="label" className="text-fg-muted">
            {t("mobile.deleteAccount.whatStaysBody")}
          </Text>
        </View>
      </Card>

      {status.isPending ? (
        <Loader className="mt-8" />
      ) : status.isError ? (
        <ErrorState className="mt-6" onRetry={status.refetch} />
      ) : blockers.length ? (
        <Card className="mt-6 gap-3 border-danger">
          <View className="flex-row items-center gap-2">
            <Icon as={CircleAlert} tone="danger" />
            <Text weight="semibold" accessibilityRole="header">
              {t("mobile.deleteAccount.blockedTitle")}
            </Text>
          </View>
          <Text variant="label" className="text-fg-muted">
            {t("mobile.deleteAccount.blockedBody")}
          </Text>
          {blockers.map((k) => (
            <Text
              key={k}
            >{`• ${t(`mobile.deleteAccount.${k}`, { count: data.blockers[k] })}`}</Text>
          ))}
          <Button variant="secondary" onPress={() => router.navigate("/library")}>
            {t("mobile.deleteAccount.openLibrary")}
          </Button>
        </Card>
      ) : (
        <View className="mt-6 gap-5">
          {data.credits > 0 ? (
            <Checkbox
              checked={giveUp}
              onChange={setGiveUp}
              label={t("mobile.deleteAccount.credits", { count: data.credits })}
              hint={t("mobile.deleteAccount.creditsRule")}
            />
          ) : null}
          {needsPassword ? (
            <Field
              label={t("mobile.deleteAccount.password")}
              hint={passwordError ? undefined : t("mobile.deleteAccount.passwordRule")}
              error={passwordError}
            >
              <PasswordInput
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  setPasswordError(null);
                }}
                autoComplete="current-password"
                textContentType="password"
                invalid={Boolean(passwordError)}
              />
            </Field>
          ) : null}
          <Button variant="danger" onPress={confirm} disabled={!ready} loading={remove.isPending}>
            {t("mobile.deleteAccount.submit")}
          </Button>
        </View>
      )}
    </StackPage>
  );
}
