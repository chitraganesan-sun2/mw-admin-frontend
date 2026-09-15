import * as SentryReact from "@sentry/react";

/**
 * Crash/error reporting for the admin console - previously nothing at all
 * caught JS exceptions or unhandled promise rejections here (unlike the backend
 * and the learner/volunteer frontend, both of which already have Sentry).
 * Shares the same Sentry project as melody-wings-frontend (by choice, to avoid
 * managing a third one) - `environment` is set explicitly so admin-console
 * events stay filterable from the other two apps' events in that shared
 * project instead of blending together.
 */
export const initSentry = () => {
    SentryReact.init({
        dsn: "https://787da0141334a28cf0259b60b40ffa1b@o4509625850658816.ingest.us.sentry.io/4509625854984192",
        environment: "admin-web",
        release: `melodywings-admin-frontend@${process.env.NEXT_PUBLIC_CURRENT_VERSION || "unknown"}`,
        // Request/response bodies, cookies, and IP can carry the same PII this
        // app's field-level encryption is meant to protect - don't forward it by
        // default, matching the backend's and the learner/volunteer frontend's
        // Sentry setups.
        sendDefaultPii: false,
        tracesSampleRate: 0.2,
        beforeBreadcrumb(breadcrumb) {
            // Strip the Authorization header value from any captured fetch/XHR
            // breadcrumbs - method/url/status stay, the JWT doesn't.
            if (breadcrumb.category === "fetch" || breadcrumb.category === "xhr") {
                if (breadcrumb.data?.request_headers) {
                    delete breadcrumb.data.request_headers;
                }
            }
            return breadcrumb;
        },
    });
};
