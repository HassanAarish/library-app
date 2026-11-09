import { useRef } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { useFormik } from "formik";
import * as Yup from "yup";
import { auth } from "@/lib/api";
import { bindField, fieldError, rules } from "@/lib/forms";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { Button, Field, Input, PasswordInput, Text, useToast } from "@/ui";
import AuthScreen, { TextLink } from "@/components/auth/AuthScreen";
import SocialButtons from "@/components/auth/SocialButtons";

export default function LoginScreen() {
  const { t } = useI18n();
  const { signIn } = useAuth();
  const toast = useToast();
  const params = useLocalSearchParams();
  const passwordRef = useRef(null);
  const r = rules(t);

  const login = useMutation({
    mutationFn: (values) => auth.login({ ...values, authType: "email" }),
    onSuccess: async ({ raw }) => {
      if (raw.twoFactorRequired) {
        router.push({ pathname: "/two-factor", params: { pendingToken: raw.pendingToken } });
        return;
      }
      // Signing in removes this screen: (auth) is only available to guests.
      const user = await signIn(raw.token);
      if (user) toast.show(t("auth.welcome", { name: user.name?.split(" ")[0] ?? "" }));
    },
    onError: (err, values) => {
      // An unverified account: go to the code step instead of a dead end.
      if (err.status === 403 && /verify your email/i.test(err.message)) {
        toast.show(t("auth.unverifiedToast"));
        router.push({
          pathname: "/verify-otp",
          params: { email: values.email, fromLogin: "1" },
        });
        return;
      }
      toast.show(err.message, { tone: "danger" });
    },
  });

  const formik = useFormik({
    initialValues: { email: params.email ?? "", password: "" },
    validationSchema: Yup.object({ email: r.email, password: r.password }),
    onSubmit: (values) => login.mutate({ ...values, email: values.email.trim() }),
  });

  return (
    <AuthScreen
      title={t("auth.loginTitle")}
      subtitle={t("auth.loginSubtitle")}
      footer={
        <View className="flex-row flex-wrap items-center justify-center gap-1.5">
          <Text variant="label" className="text-fg-muted">
            {t("auth.noAccount")}
          </Text>
          <TextLink onPress={() => router.replace("/signup")}>{t("auth.createOne")}</TextLink>
        </View>
      }
    >
      <Field label={t("auth.email")} error={fieldError(formik, "email")}>
        <Input
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
        error={fieldError(formik, "password")}
        labelAction={
          <TextLink onPress={() => router.push("/forgot-password")}>
            {t("auth.forgotLink")}
          </TextLink>
        }
      >
        <PasswordInput
          ref={passwordRef}
          {...bindField(formik, "password")}
          autoComplete="current-password"
          returnKeyType="done"
          onSubmitEditing={formik.handleSubmit}
        />
      </Field>
      <Button onPress={formik.handleSubmit} loading={login.isPending}>
        {t("auth.loginCta")}
      </Button>
      <SocialButtons />
    </AuthScreen>
  );
}
