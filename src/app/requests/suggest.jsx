import { View } from "react-native";
import { Redirect, router } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFormik } from "formik";
import * as Yup from "yup";
import { categories } from "@/lib/api";
import { bindField, fieldError } from "@/lib/forms";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { Button, Field, Input, Text, useToast } from "@/ui";
import StackPage from "@/components/StackPage";

/** Suggest a category; the admin reviews it and the reader is told the outcome. */
export default function SuggestCategoryScreen() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const send = useMutation({
    mutationFn: categories.suggest,
    onSuccess: () => {
      toast.show(t("requests.categorySent"), { tone: "success" });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      router.replace("/requests?view=mine");
    },
    onError: (err) => toast.show(err.message, { tone: "danger" }),
  });

  const formik = useFormik({
    initialValues: { name: "", description: "" },
    validationSchema: Yup.object({
      name: Yup.string()
        .trim()
        .min(2, t("requests.categoryNameRule"))
        .max(60, t("requests.categoryNameRule"))
        .required(t("requests.categoryNameRule")),
    }),
    onSubmit: (v) => send.mutate({ name: v.name.trim(), description: v.description.trim() }),
  });

  if (!isAuthenticated) return <Redirect href="/login" />;

  return (
    <StackPage>
      <Text variant="display" accessibilityRole="header">
        {t("requests.categoryTitle")}
      </Text>
      <Text className="mt-2 text-fg-muted">{t("requests.categoryBody")}</Text>
      <View className="mt-6 gap-5">
        <Field label={t("requests.categoryName")} error={fieldError(formik, "name")}>
          <Input
            {...bindField(formik, "name")}
            maxLength={60}
            placeholder={t("requests.categoryNamePlaceholder")}
          />
        </Field>
        <Field label={t("requests.categoryDescription")}>
          <Input
            {...bindField(formik, "description")}
            multiline
            maxLength={500}
            textAlignVertical="top"
            className="min-h-24 py-3"
          />
        </Field>
        <Button onPress={formik.handleSubmit} loading={send.isPending}>
          {t("requests.categorySubmit")}
        </Button>
      </View>
    </StackPage>
  );
}
