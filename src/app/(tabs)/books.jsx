import { useI18n } from "@/i18n";
import { PageHeader, Screen } from "@/ui";
import PhasePlaceholder from "@/components/PhasePlaceholder";

/** Catalogue: search, categories, the book grid (M2). Open to guests. */
export default function BooksScreen() {
  const { t } = useI18n();
  return (
    <Screen>
      <PageHeader eyebrow={t("catalog.eyebrow")} title={t("catalog.title")} />
      <PhasePlaceholder phase="M2" title={t("catalog.title")} />
    </Screen>
  );
}
