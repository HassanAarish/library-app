import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { rentals } from "@/lib/api";
import { qk } from "@/lib/queryClient";
import { useToast } from "@/ui";

/** All of the signed-in user's rentals (newest first). */
export const useMyRentals = () => {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: qk.myRentals({ limit: 100 }),
    queryFn: () => rentals.mine({ limit: 100 }),
    select: (data) => data?.results ?? [],
    enabled: isAuthenticated,
  });
};

/**
 * Rental actions: extend / return / cancel / startNow.
 * Refreshes rentals cache and availability, showing toast feedback.
 */
export const useRentalAction = (action) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const run = {
    cancel: rentals.cancel,
    extend: rentals.extend,
    return: rentals.returnEarly,
    startNow: rentals.startNow,
  }[action];

  return useMutation({
    mutationFn: (rental) => run(rental._id),
    onSuccess: ({ message }, rental) => {
      if (message) toast.show(message, { tone: "success" });
      queryClient.invalidateQueries({ queryKey: ["rentals"] });
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      const bookId = rental.bookId?._id ?? rental.bookId;
      if (bookId) {
        queryClient.invalidateQueries({ queryKey: qk.availability(bookId) });
      }
    },
    onError: (err) => {
      toast.show(err.message, { tone: "danger" });
    },
  });
};
