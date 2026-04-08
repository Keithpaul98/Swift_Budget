"use client";

// =============================================================================
// Navigation Component
// =============================================================================
// "use client" at the top tells Next.js this component runs in the browser.
// We need this because navigation uses interactive features (state, clicks).
//
// KEY CONCEPTS:
// - useState: A React "hook" that lets a component remember values (like
//   whether the mobile menu is open or closed).
// - useEffect: Runs code after the component renders (we use it to check auth)
// - Link: Next.js component for navigation — faster than <a> tags because
//   it doesn't do a full page reload.
// - Conditional rendering: {condition && <JSX>} only renders if condition is true.
// =============================================================================

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tags,
  Target,
  FolderKanban,
  Menu,
  Wallet,
  User,
  LogOut,
  HelpCircle,
  Mail,
  Moon,
  Sun,
  Shield,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ADMIN_EMAIL } from "@/lib/constants";

// Define navigation links — this array drives both desktop and mobile menus.
// Each object has a label (display text), href (URL path), and icon (Lucide icon).
const navLinks = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { label: "Categories", href: "/categories", icon: Tags },
  { label: "Budget Goals", href: "/budget-goals", icon: Target },
  { label: "Projects", href: "/projects", icon: FolderKanban },
];

const secondaryLinks = [
  { label: "Help", href: "/help", icon: HelpCircle },
  { label: "Contact", href: "/contact", icon: Mail },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  
  // User state — stores the currently logged-in user (or null if not logged in)
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Avoid hydration mismatch for theme toggle
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if user is logged in when component mounts
  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes (login, logout, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Cleanup subscription when component unmounts
    return () => subscription.unsubscribe();
  }, []);

  // Session timeout — auto-logout after 30 minutes of inactivity
  // Uses debounced handler to avoid thrashing on scroll/touch events (mobile perf)
  useEffect(() => {
    if (!user) return;

    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    let timeoutId: NodeJS.Timeout;
    let debounceId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
      }, SESSION_TIMEOUT);
    };

    const debouncedReset = () => {
      clearTimeout(debounceId);
      debounceId = setTimeout(resetTimer, 1000);
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, debouncedReset, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(debounceId);
      events.forEach((event) => window.removeEventListener(event, debouncedReset));
    };
  }, [user, supabase, router]);

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo / Brand */}
        <Link href="/" className="flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">SwiftBudget</span>
        </Link>

        {/* Desktop Navigation — hidden on mobile (md:flex means visible at medium+ screens) */}
        <nav className="hidden md:flex items-center gap-1">
          {user && navLinks.map((link) => {
            // Check if this link matches the current page
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User Profile / Auth Buttons */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle (always visible for logged-in users) */}
          {mounted && user && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:inline-flex"
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          )}
          {loading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.profile_image} />
                      <AvatarFallback>
                        {user.user_metadata?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {user.user_metadata?.username || "User"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  render={
                    <Link href="/profile" className="flex w-full items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  }
                />
                {user.email === ADMIN_EMAIL && (
                  <DropdownMenuItem
                    render={
                      <Link href="/admin" className="flex w-full items-center">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin
                      </Link>
                    }
                  />
                )}
                <DropdownMenuSeparator />
                {secondaryLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <DropdownMenuItem
                      key={link.href}
                      render={
                        <Link href={link.href} className="flex w-full items-center">
                          <Icon className="mr-2 h-4 w-4" />
                          {link.label}
                        </Link>
                      }
                    />
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              {mounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Toggle theme"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
              )}
              <Link
                href="/login"
                className="inline-flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Navigation — Sheet is a slide-out panel (like a drawer) */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="md:hidden"
            render={
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            }
          />
          <SheetContent side="left" className="w-64">
            <SheetTitle className="flex items-center gap-2 px-2">
              <Wallet className="h-5 w-5 text-primary" />
              <span className="font-bold">SwiftBudget</span>
            </SheetTitle>
            <Separator className="my-4" />
            
            {user ? (
              <>
                {/* User info */}
                <div className="px-3 py-2 mb-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.user_metadata?.profile_image} />
                      <AvatarFallback>
                        {user.user_metadata?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {user.user_metadata?.username || "User"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </div>
                </div>
                <Separator className="my-4" />
                
                {/* Navigation links */}
                <nav className="flex flex-col gap-1">
                  {navLinks.map((link) => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {link.label}
                      </Link>
                    );
                  })}
                  
                  <Separator className="my-2" />
                  
                  {/* Profile link */}
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>

                  {/* Admin link — only for admin user */}
                  {user.email === ADMIN_EMAIL && (
                    <Link
                      href="/admin"
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        pathname === "/admin"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Shield className="h-4 w-4" />
                      Admin
                    </Link>
                  )}

                  <Separator className="my-2" />

                  {/* Help & Contact */}
                  {secondaryLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      >
                        <Icon className="h-4 w-4" />
                        {link.label}
                      </Link>
                    );
                  })}
                  
                  {/* Theme Toggle */}
                  {mounted && (
                    <button
                      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                      {theme === "dark" ? "Light Mode" : "Dark Mode"}
                    </button>
                  )}

                  <Separator className="my-2" />

                  {/* Logout button */}
                  <button
                    onClick={() => {
                      handleLogout();
                      setOpen(false);
                    }}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </nav>
              </>
            ) : (
              <div className="flex flex-col gap-2 px-3">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/80"
                >
                  Sign up
                </Link>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
