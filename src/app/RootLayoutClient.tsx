"use client";

import * as SentryReact from "@sentry/react";
import { Suspense } from "react";
import QueryProvider from "@/providers/QueryWrapper";
import PageLoader from "@/components/common/Loader/PageLoader";
import { initSentry } from "@/services/sentry";

// Module scope, not component body - runs exactly once per page load rather
// than on every render.
initSentry();

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
    return (
        <SentryReact.ErrorBoundary
            fallback={
                <div className="h-screen w-screen flex flex-col items-center justify-center gap-2 text-center px-4">
                    <p className="text-lg font-medium">Something went wrong.</p>
                    <p className="text-sm text-gray-500">Please refresh the page.</p>
                </div>
            }
        >
            <Suspense fallback={<PageLoader />}>
                <QueryProvider>{children}</QueryProvider>
            </Suspense>
        </SentryReact.ErrorBoundary>
    );
}
