import Cookies from "js-cookie";

// The admin console keeps exactly two cookies: the API token and the shared inactivity timestamp.
// (It used to also clear role / onboarded_status / learner_id / volunteer_id, which only the
// member-facing app ever sets.) The token cookie is set client-side, so it cannot be HttpOnly -
// making it HttpOnly needs the backend to set it on /admin/auth/sign_in (tracked as a backend item).
export const SESSION_COOKIES = ["token", "lastActivity"] as const;

export const clearSessionCookies = () => {
    for (const name of SESSION_COOKIES) Cookies.remove(name, { path: "/" });
};

// Cookie flags for anything the console sets itself: never sent cross-site, https-only in production.
export const sessionCookieOptions = (expires: number) => ({
    expires,
    path: "/",
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
});
