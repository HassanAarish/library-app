import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { PageHeader, Screen } from "@/ui";
import PhasePlaceholder from "@/components/PhasePlaceholder";
import SignInPrompt from "@/components/SignInPrompt";

/** My library: current and upcoming rentals, open the reader (M3). */
export default function LibraryScreen() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  return (
    <Screen>
      <PageHeader title={t("nav.myLibrary")} />
      {isAuthenticated ? (
        <PhasePlaceholder phase="M3" title={t("nav.myLibrary")} />
      ) : (
        <SignInPrompt />
      )}
    </Screen>
  );
}
