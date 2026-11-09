import { router } from "expo-router";
import { LogIn, WifiOff } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { EmptyState } from "@/ui";

/**
 * Shown on tabs that need an account when nobody is signed in. With a saved
 * session the server couldn't confirm, it offers a retry instead.
 */
const SignInPrompt = () => {
  const { t } = useI18n();
  const { status, retry } = useAuth();

  if (status === "offline") {
    return (
      <EmptyState
        icon={WifiOff}
        title={t("mobile.offline.title")}
        description={t("mobile.offline.body")}
        action={t("common.retry")}
        onAction={retry}
      />
    );
  }

  return (
    <EmptyState
      icon={LogIn}
      title={t("mobile.signInPrompt.title")}
      description={t("mobile.signInPrompt.body")}
      action={t("nav.signIn")}
      onAction={() => router.push("/login")}
    />
  );
};

export default SignInPrompt;
