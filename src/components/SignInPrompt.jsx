import { LogIn } from "lucide-react-native";
import { useI18n } from "@/i18n";
import { EmptyState } from "@/ui";

/** Shown on tabs that need an account when nobody is signed in (sign-in arrives in M1). */
const SignInPrompt = () => {
  const { t } = useI18n();
  return (
    <EmptyState
      icon={LogIn}
      title={t("mobile.signInPrompt.title")}
      description={t("mobile.signInPrompt.body")}
    />
  );
};

export default SignInPrompt;
