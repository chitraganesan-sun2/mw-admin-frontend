"use client";

import useAutoLogout from "@/hooks/useAutoLogout";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useRouter } from "next/navigation";
import { NuqsAdapter } from "nuqs/adapters/next";
import { Toaster } from "react-hot-toast";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  useAutoLogout(router);
  
  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        {children}
        <Toaster />
        <ReactQueryDevtools initialIsOpen={true} buttonPosition="bottom-left" />
      </NuqsAdapter>
    </QueryClientProvider>
  );
}
