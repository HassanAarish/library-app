import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useI18n } from "@/i18n";
import { cn } from "./cn";
import Icon from "./Icon";

/** Goes back, or Home when the screen was opened directly (a deep link). */
const BackButton = ({ className }) => {
  const { t } = useI18n();
  return (
    <Pressable
      onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
      accessibilityRole="button"
      accessibilityLabel={t("common.back")}
      className={cn("-ms-2 size-11 items-center justify-center", className)}
    >
      <View className="rtl:rotate-180">
        <Icon as={ArrowLeft} />
      </View>
    </Pressable>
  );
};

export default BackButton;
