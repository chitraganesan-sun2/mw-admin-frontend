"use client";

import { useQuery } from "@tanstack/react-query";
import { GET_API } from "@/api/request";
import { endpoints } from "@/api/constants";
import { hasPermission, type Permission, type Staff } from "@/constants/access";

/**
 * Who the SERVER says is signed in (role + permissions). The token in the cookie is readable and
 * editable by the browser, so navigation and page guards are built from this instead; the API
 * enforces the same permissions regardless.
 */
export function useStaff() {
  return useQuery<Staff>({
    queryKey: ["staff", "me"],
    queryFn: async () => (await GET_API(endpoints.auth.me))?.data as Staff,
    staleTime: 60 * 1000,
    // A role change should show up within a minute or when the tab regains focus.
    refetchOnWindowFocus: true,
  });
}

/**
 * Whether the signed-in account may do one thing. False while the account is still loading, so a
 * control for a privileged action never flashes up and then disappears.
 */
export function useCan(permission: Permission): boolean {
  const { data } = useStaff();
  return hasPermission(data?.permissions, permission);
}
