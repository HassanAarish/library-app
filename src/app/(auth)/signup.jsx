import { useRef } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useMutation } from "@tanstack/react-query";
import { useFormik } from "formik";
import * as Yup from "yup";
import { auth } from "@/lib/api";
import { bindField, fieldError, rules } from "@/lib/forms";
import { siteURL } from "@/constants";
import { useI18n } from "@/i18n";
import { Button, Field, Input, PasswordInput, Text, useToast } from "@/ui";
import AuthScreen, { TextLink } from "@/components/auth/AuthScreen";
import SocialButtons from "@/components/auth/SocialButtons";

export default function SignupScreen() {
  const { t } = useI18n();
  const toast = useToast();
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const r = rules(t);

  const register = useMutation({
    mutationFn: (values) => auth.register({ ...values, authType: "email" }),
    // No token yet: the email must be verified with the emailed code first.
    onSuccess: ({ message }, values) => {
      toast.show(message, { tone: "success" });
      router.push({ pathname: "/verify-otp", params: { email: values.email } });
    },
    onError: (err) => toast.show(err.message, { tone: "danger" }),
  });

  const formik = useFormik({
    initialValues: { name: "", email: "", password: "" },
    validationSchema: Yup.object({ name: r.name, email: r.email, password: r.newPassword }),
    onSubmit: (values) =>
      register.mutate({ ...values, name: values.name.trim(), email: values.email.trim() }),
  });

  return (
    <AuthScreen
      title={t("auth.signupTitle")}
      subtitle={t("mobile.auth.signupSubtitle")}
      footer={
        <View className="flex-row flex-wrap items-center justify-center gap-1.5">
          <Text variant="label" className="text-fg-muted">
            {t("auth.haveAccount")}
          </Text>
          <TextLink onPress={() => router.replace("/login")}>{t("auth.signInInstead")}</TextLink>
        </View>
      }
    >
      <Field label={t("auth.name")} error={fieldError(formik, "name")}>
        <Input
          {...bindField(formik, "name")}
          autoComplete="name"
          autoCapitalize="words"
          placeholder={t("auth.namePlaceholder")}
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
        />
      </Field>
      <Field label={t("auth.email")} error={fieldError(formik, "email")}>
        <Input
          ref={emailRef}
          {...bindField(formik, "email")}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          placeholder={t("auth.emailPlaceholder")}
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
      </Field>
      <Field
        label={t("auth.password")}
        hint={t("auth.passwordHint")}
        error={fieldError(formik, "password")}
      >
        <PasswordInput
          ref={passwordRef}
          {...bindField(formik, "password")}
          autoComplete="new-password"
          returnKeyType="done"
          onSubmitEditing={formik.handleSubmit}
        />
      </Field>
      <Button onPress={formik.handleSubmit} loading={register.isPending}>
        {t("auth.signupCta")}
      </Button>

      {siteURL ? (
        <View className="flex-row flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
          <Text variant="caption">{t("auth.agreePrefix")}</Text>
          <TextLink onPress={() => WebBrowser.openBrowserAsync(`${siteURL}/terms`)}>
            {t("footer.terms")}
          </TextLink>
          <Text variant="caption">{t("auth.agreeAnd")}</Text>
          <TextLink onPress={() => WebBrowser.openBrowserAsync(`${siteURL}/privacy`)}>
            {t("footer.privacy")}
          </TextLink>
        </View>
      ) : null}

      <SocialButtons />
    </AuthScreen>
  );
}
