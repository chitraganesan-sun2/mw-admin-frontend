"use client";

import * as SentryReact from "@sentry/react";
import { Suspense } from "react";
import { ConfigProvider } from "antd";
import QueryProvider from "@/providers/QueryWrapper";
import PageLoader from "@/components/common/Loader/PageLoader";
import { initSentry } from "@/services/sentry";

// Module scope, not component body - runs exactly once per page load rather
// than on every render.
initSentry();

// Next 15's App Router runs React 19, where react-dom no longer exports render/createRoot.
// antd 5.22's button wave (click ripple) renders through rc-util's legacy path, so every
// antd button click threw an uncaught "reactRender is not a function" (Sentry noise).
// Nothing here uses antd's static Modal.confirm/message/notification APIs, the other
// callers of that path, so disabling the ripple removes the only trigger without adding
// @ant-design/v5-patch-for-react-19 or upgrading antd.
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
                <ConfigProvider wave={{ disabled: true }}>
                    <QueryProvider>{children}</QueryProvider>
                </ConfigProvider>
            </Suspense>
        </SentryReact.ErrorBoundary>
    );
}
