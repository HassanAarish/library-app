import { Redirect, router, useLocalSearchParams } from "expo-router";
import { ShieldCheck } from "lucide-react-native";
import { useMutation } from "@tanstack/react-query";
import { useFormik } from "formik";
import * as Yup from "yup";
import { twoFactor } from "@/lib/api";
import { fieldError, rules } from "@/lib/forms";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { Button, CodeInput, Field, Text, useToast } from "@/ui";
import AuthScreen, { TextLink } from "@/components/auth/AuthScreen";

/** Second step after a password or social sign-in, when 2FA is on. */
export default function TwoFactorScreen() {
  const { t } = useI18n();
  const { signIn } = useAuth();
  const toast = useToast();
  const { pendingToken } = useLocalSearchParams();

  const verify = useMutation({
    mutationFn: ({ code }) => twoFactor.verify({ pendingToken, code }),
    onSuccess: async ({ raw }) => {
      const user = await signIn(raw.token);
      if (user) {
        toast.show(
          raw.deletionCancelled
            ? t("mobile.account.deletionKept")
            : t("auth.welcome", { name: user.name?.split(" ")[0] ?? "" }),
        );
      }
    },
    onError: (err) => toast.show(err.message, { tone: "danger" }),
  });

  const formik = useFormik({
    initialValues: { code: "" },
    validationSchema: Yup.object({ code: rules(t).code }),
    onSubmit: (values) => verify.mutate(values),
  });

  // Only reachable right after the first step.
  if (!pendingToken) return <Redirect href="/login" />;

  return (
    <AuthScreen
      icon={ShieldCheck}
      title={t("auth.twoFactorTitle")}
      subtitle={t("auth.twoFactorSubtitle")}
      footer={
        <TextLink onPress={() => router.replace("/login")}>{t("auth.backToSignIn")}</TextLink>
      }
    >
      <Field label={t("auth.twoFactorCode")} error={fieldError(formik, "code")}>
        <CodeInput
          // No onBlur: the error waits for the button, as on the email-code step.
          value={formik.values.code}
          onChangeText={formik.handleChange("code")}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={formik.handleSubmit}
        />
      </Field>
      <Button onPress={formik.handleSubmit} loading={verify.isPending}>
        {t("auth.twoFactorCta")}
      </Button>
      <Text variant="caption">{t("auth.twoFactorLost")}</Text>
    </AuthScreen>
  );
}
