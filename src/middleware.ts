import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// =============================================================================
// Next.js Middleware
// =============================================================================
// Middleware runs BEFORE every page request. It's like Flask's @login_required
// decorator, but it works globally.
//
// What it does:
//   1. Refreshes the user's auth session (keeps them logged in)
//   2. Protects routes — redirects unauthenticated users to /login
//   3. Redirects authenticated users away from /login and /signup
//
// The `config.matcher` at the bottom defines which routes this runs on.
// =============================================================================

// Routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/transactions",
  "/categories",
  "/budget-goals",
  "/projects",
  "/profile",
];

// Routes only for unauthenticated users
const authRoutes = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  // Skip middleware if Supabase is not configured yet (during initial setup)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project-url')) {
    // Supabase not configured yet — allow all requests during development
    return NextResponse.next({ request });
  }

  // Create a response that we can modify (add/remove cookies)
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Create a Supabase client that can read/write cookies in the middleware
  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Set cookies on the request (for downstream server components)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Also set cookies on the response (for the browser)
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session — this keeps the user logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // If user is NOT logged in and tries to access a protected route → redirect to /login
  if (!user && protectedRoutes.some((route) => pathname.startsWith(route))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // If user IS logged in and tries to access login/signup → redirect to /dashboard
  if (user && authRoutes.some((route) => pathname.startsWith(route))) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

// Only run middleware on these routes (skip static files, images, etc.)
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
