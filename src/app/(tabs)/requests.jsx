import { useI18n } from "@/i18n";
import { PageHeader, Screen } from "@/ui";
import PhasePlaceholder from "@/components/PhasePlaceholder";

/** Book requests: the public list, follow, request a book (M4). */
export default function RequestsScreen() {
  const { t } = useI18n();
  return (
    <Screen>
      <PageHeader
        eyebrow={t("requests.eyebrow")}
        title={t("requests.title")}
        description={t("requests.description")}
      />
      <PhasePlaceholder phase="M4" title={t("requests.title")} />
    </Screen>
  );
}
