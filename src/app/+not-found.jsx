import { router } from "expo-router";
import { Compass } from "lucide-react-native";
import { useI18n } from "@/i18n";
import { EmptyState, Screen } from "@/ui";

/** Unknown deep link, e.g. libraryhub://nowhere. */
export default function NotFoundScreen() {
  const { t } = useI18n();
  return (
    <Screen>
      <EmptyState
        icon={Compass}
        title={t("errors.notFoundTitle")}
        description={t("mobile.notFound")}
        action={t("errors.goHome")}
        onAction={() => router.replace("/")}
        className="mt-16"
      />
    </Screen>
  );
}
