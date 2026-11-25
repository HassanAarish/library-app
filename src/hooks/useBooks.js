import { useEffect, useState } from "react";
import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { books, categories, rentals } from "@/lib/api";
import { qk } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useWatchBook } from "@/realtime/SocketProvider";

const PAGE_SIZE = 20;

/** The catalogue as an endless list: the next page loads as the reader scrolls. */
export const useCatalog = (params) =>
  useInfiniteQuery({
    queryKey: qk.catalog({ ...params, list: "infinite" }),
    queryFn: ({ pageParam }) => books.catalog({ ...params, page: pageParam, limit: PAGE_SIZE }),
    // Keep the current results on screen while a new search or filter loads.
    placeholderData: keepPreviousData,
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    select: (data) => ({
      books: data.pages.flatMap((p) => p.results),
      total: data.pages[0]?.totalDocs ?? 0,
    }),
  });

/** The newest books, for the Home shelf. */
export const useNewArrivals = (limit = 10) =>
  useQuery({
    queryKey: qk.catalog({ sort: "newest", limit }),
    queryFn: () => books.catalog({ sort: "newest", limit }),
    select: (data) => data?.results ?? [],
  });

export const useBook = (bookId) =>
  useQuery({
    queryKey: qk.book(bookId),
    queryFn: () => books.get(bookId),
    enabled: Boolean(bookId),
    staleTime: 5 * 60_000,
  });

/** Approved categories for filters (they change rarely). */
export const useCategories = () =>
  useQuery({
    queryKey: qk.categories({ limit: 100 }),
    queryFn: () => categories.list({ limit: 100 }),
    select: (data) => data?.results ?? [],
    staleTime: 10 * 60_000,
  });

/**
 * A book's live availability: refetched whenever anyone books, cancels or
 * returns it (socket), and personalised (place in line) when signed in.
 */
export const useAvailability = (bookId) => {
  const { status, user } = useAuth();
  useWatchBook(bookId);
  return useQuery({
    // The user id is part of the key: the answer differs per viewer.
    queryKey: [...qk.availability(bookId), user?._id ?? "guest"],
    queryFn: () => rentals.availability(bookId),
    enabled: Boolean(bookId) && status !== "loading",
    staleTime: 15_000,
  });
};

/** `value`, but only after it stopped changing for `delay` ms (search boxes). */
export const useDebouncedValue = (value, delay = 350) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
};
