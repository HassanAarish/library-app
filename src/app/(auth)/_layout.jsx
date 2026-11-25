import { Stack } from "expo-router";
import { useCSSVariable } from "uniwind";

/** The sign-in flow: login, signup, verify-otp, forgot-password, two-factor. */
export default function AuthLayout() {
  const canvas = useCSSVariable("--color-canvas");
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: canvas } }} />
  );
}
