import { useEffect, useState } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { useFormik } from "formik";
import * as Yup from "yup";
import { auth } from "@/lib/api";
import { fieldError, rules } from "@/lib/forms";
import { useI18n } from "@/i18n";
import { Button, CodeInput, Field, Text, useToast } from "@/ui";
import AuthScreen, { TextLink } from "@/components/auth/AuthScreen";

// Matches the backend's RESEND_COOLDOWN_MS.
const RESEND_COOLDOWN = 60;

export default function VerifyOtpScreen() {
  const { t } = useI18n();
  const toast = useToast();
  const { email = "", fromLogin } = useLocalSearchParams();

  // After sign-up a code was just sent, so wait. From a login redirect none was.
  const [cooldown, setCooldown] = useState(fromLogin ? 0 : RESEND_COOLDOWN);
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const verify = useMutation({
    mutationFn: ({ otp }) => auth.verifyOtp({ email, otp }),
    onSuccess: () => {
      toast.show(t("auth.verifiedToast"), { tone: "success" });
      router.replace({ pathname: "/login", params: { email } });
    },
    onError: (err) => toast.show(err.message, { tone: "danger" }),
  });

  const resend = useMutation({
    mutationFn: () => auth.resendOtp({ email }),
    onSuccess: ({ message }) => {
      toast.show(message, { tone: "success" });
      setCooldown(RESEND_COOLDOWN);
    },
    onError: (err) => toast.show(err.message, { tone: "danger" }),
  });

  const formik = useFormik({
    initialValues: { otp: "" },
    validationSchema: Yup.object({ otp: rules(t).code }),
    onSubmit: (values) => verify.mutate(values),
  });

  return (
    <AuthScreen
      title={t("auth.verifyTitle")}
      subtitle={email ? t("auth.verifySubtitle", { email }) : t("auth.verifySubtitleNoEmail")}
      footer={
        <View className="flex-row flex-wrap items-center justify-center gap-1.5">
          <Text variant="label" className="text-fg-muted">
            {t("auth.wrongEmail")}
          </Text>
          <TextLink onPress={() => router.replace("/signup")}>{t("auth.startOver")}</TextLink>
        </View>
      }
    >
      <Field label={t("auth.code")} error={fieldError(formik, "otp")}>
        <CodeInput
          // No onBlur: the "enter the code" error waits for Verify, so leaving the empty
          // field never shifts the page under a tap.
          value={formik.values.otp}
          onChangeText={formik.handleChange("otp")}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={formik.handleSubmit}
        />
      </Field>
      <Button onPress={formik.handleSubmit} loading={verify.isPending} disabled={!email}>
        {t("auth.verifyCta")}
      </Button>

      {email ? (
        <View className="flex-row flex-wrap items-center justify-center gap-1.5">
          <Text variant="label" className="text-fg-muted">
            {t("auth.noCode")}
          </Text>
          {cooldown > 0 ? (
            <Text variant="label" className="text-fg-subtle">
              {t("auth.resendIn", { seconds: cooldown })}
            </Text>
          ) : (
            <TextLink onPress={() => resend.mutate()} disabled={resend.isPending}>
              {resend.isPending ? t("auth.sending") : t("auth.resend")}
            </TextLink>
          )}
        </View>
      ) : null}
    </AuthScreen>
  );
}
