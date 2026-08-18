import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isLogin = nextUrl.pathname.startsWith("/login");
  const isAdminRoute = nextUrl.pathname.startsWith("/configuracion");

  if (!isLoggedIn && !isLogin) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }
  if (isLoggedIn && isLogin) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }
  if (isLoggedIn && isAdminRoute && req.auth?.user?.rol !== "admin") {
    return NextResponse.redirect(new URL("/", nextUrl));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|logo.png).*)"],
};
