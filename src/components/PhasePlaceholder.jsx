import { Hammer } from "lucide-react-native";
import { useI18n } from "@/i18n";
import { EmptyState } from "@/ui";

/** Stand-in for tab content that a later mobile phase builds (removed by M5). */
const PhasePlaceholder = ({ phase, title }) => {
  const { t } = useI18n();
  return <EmptyState icon={Hammer} title={title} description={t("mobile.comingSoon", { phase })} />;
};

export default PhasePlaceholder;
