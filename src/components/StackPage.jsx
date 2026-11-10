import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import { BackButton } from "@/ui";

const StyledSafeArea = withUniwind(SafeAreaView);

/**
 * Frame for screens opened on top of the tabs (a request, the request form,
 * the inbox): safe areas, a back button, and content that stays above the
 * keyboard. `scroll={false}` when the screen brings its own list.
 */
const StackPage = ({ children, scroll = true, right }) => (
  <StyledSafeArea edges={["top", "bottom"]} className="flex-1 bg-canvas">
    <View className="flex-row items-center justify-between px-4 pt-2">
      <BackButton />
      {right}
    </View>
    {scroll ? (
      <KeyboardAvoidingView
        behavior={Platform.OS === "web" ? undefined : "padding"}
        className="flex-1"
      >
        <ScrollView contentContainerClassName="px-4 pb-10 pt-2" keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    ) : (
      <View className="flex-1">{children}</View>
    )}
  </StyledSafeArea>
);

export default StackPage;
