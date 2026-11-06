import { Tabs } from "expo-router";
import { BookOpen, Home, Library, MessageSquarePlus, UserRound } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCSSVariable } from "uniwind";
import { useI18n } from "@/i18n";

/** Bottom tabs: Home · Books · Library · Requests · Account. */
export default function TabsLayout() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [surface, line, brand, subtle] = useCSSVariable([
    "--color-surface",
    "--color-line",
    "--color-brand",
    "--color-fg-subtle",
  ]);

  const tab = (name, title, Glyph) => (
    <Tabs.Screen
      name={name}
      options={{
        title,
        tabBarIcon: ({ color, size }) => <Glyph color={color} size={size} />,
      }}
    />
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: brand,
        tabBarInactiveTintColor: subtle,
        // Inter is taller than the system font the default 49px bar is sized
        // for, so the bar is 60px (plus the phone's gesture-bar inset).
        tabBarStyle: {
          backgroundColor: surface,
          borderTopColor: line,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarLabelStyle: { fontFamily: "Inter_500Medium", fontSize: 11, lineHeight: 16 },
      }}
    >
      {tab("index", t("mobile.tabs.home"), Home)}
      {tab("books", t("mobile.tabs.books"), BookOpen)}
      {tab("library", t("mobile.tabs.library"), Library)}
      {tab("requests", t("mobile.tabs.requests"), MessageSquarePlus)}
      {tab("account", t("mobile.tabs.account"), UserRound)}
    </Tabs>
  );
}
