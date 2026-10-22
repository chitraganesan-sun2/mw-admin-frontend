import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtDecode } from "jwt-decode";
import { canAccessPath, KNOWN_ROLES, ROLE_HOME, ROLE_PERMISSIONS_UX, StaffRole } from "./constants/access";

// The role claim in the cookie's token is only used to route (it is readable and editable in the
// browser). The API re-reads the role from the database on every request and refuses anything
// the account may not do, so a tampered token gets a redirect here at best and 401/403 there.
const readStaffRole = (token: string | undefined): StaffRole | null => {
    if (!token) return null;

    try {
        const decodedToken: { exp?: number; role?: string } = jwtDecode(token);
        const currentTime = Math.floor(Date.now() / 1000);
        if (decodedToken.exp && decodedToken.exp < currentTime) return null;
        // This console is for portal staff only. A learner/volunteer JWT (minted by the public
        // app - same signing secret) must not load the shell.
        return KNOWN_ROLES.includes(decodedToken.role as StaffRole) ? (decodedToken.role as StaffRole) : null;
    } catch {
        return null;
    }
};

export default function middleware(req: NextRequest) {
    const { pathname, origin } = req.nextUrl;
    const token = req.cookies.get("token")?.value;

    if (pathname.startsWith("/_next") || pathname === "/favicon.ico") {
        return NextResponse.next();
    }

    const role = readStaffRole(token);
    if (!role && pathname !== "/") {
        return NextResponse.redirect(new URL("/", origin));
    }
    if (role && pathname === "/") {
        return NextResponse.redirect(new URL(ROLE_HOME[role], origin));
    }
    // Files served from /public (logo, lottie JSON, icons) are not pages and have no permission.
    const isStaticFile = /\.[a-z0-9]+$/i.test(pathname);
    if (role && !isStaticFile && !canAccessPath(pathname, ROLE_PERMISSIONS_UX[role])) {
        return NextResponse.redirect(new URL("/access-denied", origin));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
