import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtDecode } from "jwt-decode";

const isTokenValid = (token: string | undefined): boolean => {
    if (!token) return false;

    try {
        const decodedToken: { exp?: number } = jwtDecode(token);
        const currentTime = Math.floor(Date.now() / 1000);
        if (decodedToken.exp && decodedToken.exp < currentTime) return false;
        return true;
    } catch {
        return false;
    }
};

export default function middleware(req: NextRequest) {
    const { pathname, origin } = req.nextUrl;
    const token = req.cookies.get("token")?.value;

    if (pathname.startsWith("/_next") || pathname === "/favicon.ico") {
        return NextResponse.next();
    }

    const isValidToken = isTokenValid(token);
    if (!isValidToken && pathname !== "/") {
        return NextResponse.redirect(new URL("/", origin));
    }
    if (isValidToken && pathname === "/") {
        return NextResponse.redirect(new URL("/volunteer", origin));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
