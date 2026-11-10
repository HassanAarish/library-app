import { useState } from "react";
import { View } from "react-native";
import { Redirect, router } from "expo-router";
import { BookCheck } from "lucide-react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFormik } from "formik";
import * as Yup from "yup";
import { bookRequests } from "@/lib/api";
import { bindField, fieldError } from "@/lib/forms";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { BookCover, Button, Field, Input, Text, useToast } from "@/ui";
import BookLookup from "@/components/requests/BookLookup";
import StackPage from "@/components/StackPage";

/**
 * Request a book. The backend merges duplicates: the answer is a new request,
 * "added you to an existing one", or "it's already in the library".
 */
export default function NewRequestScreen() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [inLibrary, setInLibrary] = useState(null);

  const send = useMutation({
    mutationFn: (values) => bookRequests.create(values),
    onSuccess: ({ data }) => {
      if (data.alreadyInLibrary) {
        setInLibrary(data.alreadyInLibrary);
        return;
      }
      toast.show(
        data.alreadyFollowing
          ? t("requests.alreadyFollowing")
          : data.joined
            ? t("requests.joined")
            : t("requests.created"),
        { tone: "success" },
      );
      queryClient.invalidateQueries({ queryKey: ["bookRequests"] });
      router.replace(`/requests/${data.request._id}`);
    },
    onError: (err) => toast.show(err.message, { tone: "danger" }),
  });

  const formik = useFormik({
    initialValues: { title: "", author: "", isbn: "", language: "", note: "" },
    validationSchema: Yup.object({
      title: Yup.string().trim().required(t("requests.titleRequired")),
    }),
    onSubmit: (values) =>
      send.mutate(Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim()]))),
  });

  if (!isAuthenticated) return <Redirect href="/login" />;

  if (inLibrary) {
    return (
      <StackPage>
        <View className="items-center gap-4 pt-6">
          <BookCover
            src={inLibrary.coverImage?.url}
            title={inLibrary.title}
            author={inLibrary.author}
            width={120}
          />
          <Text variant="title" accessibilityRole="header" className="text-center">
            {t("requests.inLibraryTitle")}
          </Text>
          <Text className="text-center text-fg-muted">
            {t("mobile.requests.inLibraryBody", { title: inLibrary.title })}
          </Text>
          <Button icon={BookCheck} onPress={() => router.replace(`/books/${inLibrary._id}`)}>
            {t("mobile.requests.seeBook")}
          </Button>
        </View>
      </StackPage>
    );
  }

  return (
    <StackPage>
      <Text variant="display" accessibilityRole="header">
        {t("requests.formTitle")}
      </Text>
      <Text className="mt-2 text-fg-muted">{t("requests.formDescription")}</Text>

      <View className="mt-6 gap-5">
        <BookLookup
          onPick={(item) =>
            formik.setValues({
              ...formik.values,
              title: item.title ?? "",
              author: item.author ?? "",
              isbn: item.isbn ?? "",
              language: item.language ?? formik.values.language,
            })
          }
        />
        <Field label={t("requests.bookTitle")} error={fieldError(formik, "title")}>
          <Input {...bindField(formik, "title")} maxLength={200} />
        </Field>
        <Field label={t("requests.author")}>
          <Input {...bindField(formik, "author")} maxLength={120} />
        </Field>
        <Field label={t("requests.isbn")}>
          <Input {...bindField(formik, "isbn")} keyboardType="number-pad" maxLength={20} />
        </Field>
        <Field label={t("requests.language")}>
          <Input {...bindField(formik, "language")} maxLength={40} />
        </Field>
        <Field label={t("requests.note")}>
          <Input
            {...bindField(formik, "note")}
            multiline
            maxLength={500}
            placeholder={t("requests.notePlaceholder")}
            textAlignVertical="top"
            className="min-h-24 py-3"
          />
        </Field>
        <Button onPress={formik.handleSubmit} loading={send.isPending}>
          {t("requests.submit")}
        </Button>
      </View>
    </StackPage>
  );
}
