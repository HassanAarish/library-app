import { useState } from "react";
import { router } from "expo-router";
import { MailCheck } from "lucide-react-native";
import { useMutation } from "@tanstack/react-query";
import { useFormik } from "formik";
import * as Yup from "yup";
import { auth } from "@/lib/api";
import { bindField, fieldError, rules } from "@/lib/forms";
import { useI18n } from "@/i18n";
import { Button, Field, Input, useToast } from "@/ui";
import AuthScreen, { TextLink } from "@/components/auth/AuthScreen";

/** Asks for the reset email; its link opens the website, where the new password is set. */
export default function ForgotPasswordScreen() {
  const { t } = useI18n();
  const toast = useToast();
  const [sentTo, setSentTo] = useState("");

  const send = useMutation({
    mutationFn: ({ email }) => auth.forgotPassword({ email }),
    // The backend answers the same whether or not the account exists.
    onSuccess: (_, { email }) => setSentTo(email),
    onError: (err) => toast.show(err.message, { tone: "danger" }),
  });

  const formik = useFormik({
    initialValues: { email: "" },
    validationSchema: Yup.object({ email: rules(t).email }),
    onSubmit: ({ email }) => send.mutate({ email: email.trim() }),
  });

  const back = (
    <TextLink onPress={() => router.replace("/login")}>{t("auth.backToSignIn")}</TextLink>
  );

  if (sentTo) {
    return (
      <AuthScreen
        icon={MailCheck}
        title={t("auth.forgotSentTitle")}
        subtitle={t("auth.forgotSentBody", { email: sentTo })}
        footer={back}
      />
    );
  }

  return (
    <AuthScreen title={t("auth.forgotTitle")} subtitle={t("auth.forgotSubtitle")} footer={back}>
      <Field label={t("auth.email")} error={fieldError(formik, "email")}>
        <Input
          {...bindField(formik, "email")}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          placeholder={t("auth.emailPlaceholder")}
          returnKeyType="done"
          onSubmitEditing={formik.handleSubmit}
        />
      </Field>
      <Button onPress={formik.handleSubmit} loading={send.isPending}>
        {t("auth.forgotCta")}
      </Button>
    </AuthScreen>
  );
}
