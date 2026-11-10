import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { bookRequests, categories, lookup } from "@/lib/api";
import { qk } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { useToast } from "@/ui";

const PAGE_SIZE = 20;
const nextPage = (last) => (last.page < last.totalPages ? last.page + 1 : undefined);

/** Public list of requests as an endless list (signed-in viewers also get `following`). */
export const useBookRequests = (params) => {
  const { status, user } = useAuth();
  return useInfiniteQuery({
    queryKey: [...qk.bookRequests({ ...params, list: "infinite" }), user?._id ?? "guest"],
    queryFn: ({ pageParam }) => bookRequests.list({ ...params, page: pageParam, limit: PAGE_SIZE }),
    placeholderData: keepPreviousData,
    initialPageParam: 1,
    getNextPageParam: nextPage,
    enabled: status !== "loading",
    select: (data) => ({
      requests: data.pages.flatMap((p) => p.results),
      total: data.pages[0]?.totalDocs ?? 0,
    }),
  });
};

export const useBookRequest = (requestId) => {
  const { status, user } = useAuth();
  return useQuery({
    queryKey: [...qk.bookRequest(requestId), user?._id ?? "guest"],
    queryFn: () => bookRequests.get(requestId),
    enabled: Boolean(requestId) && status !== "loading",
  });
};

/** Requests I asked for or follow. */
export const useMyBookRequests = () => {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: qk.myBookRequests({ limit: 50 }),
    queryFn: () => bookRequests.mine({ limit: 50 }),
    select: (data) => data?.results ?? [],
    enabled: isAuthenticated,
  });
};

export const useMyCategorySuggestions = () => {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: qk.myCategories,
    queryFn: () => categories.mine({ limit: 50 }),
    select: (data) => data?.results ?? [],
    enabled: isAuthenticated,
  });
};

/** Follow / unfollow a request ("I want this too"). */
export const useFollowRequest = () => {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ request, follow }) =>
      follow ? bookRequests.follow(request._id) : bookRequests.unfollow(request._id),
    onSuccess: (_, { follow }) => {
      toast.show(follow ? t("requests.followed") : t("requests.unfollowed"), { tone: "success" });
      queryClient.invalidateQueries({ queryKey: ["bookRequests"] });
    },
    onError: (err) => toast.show(err.message, { tone: "danger" }),
  });
};

/** Open Library suggestions while typing (signed in; debounce the text first). */
export const useBookLookup = (q) => {
  const { isAuthenticated } = useAuth();
  const text = q.trim();
  return useQuery({
    queryKey: ["lookup", text.toLowerCase()],
    queryFn: () => lookup.search({ q: text, limit: 6 }),
    enabled: isAuthenticated && text.length >= 3,
    staleTime: 60 * 60_000,
    retry: false,
  });
};
