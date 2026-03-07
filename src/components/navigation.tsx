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
// - Link: Next.js component for navigation — faster than <a> tags because
//   it doesn't do a full page reload.
// - Conditional rendering: {condition && <JSX>} only renders if condition is true.
// =============================================================================

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tags,
  Target,
  FolderKanban,
  Menu,
  X,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// Define navigation links — this array drives both desktop and mobile menus.
// Each object has a label (display text), href (URL path), and icon (Lucide icon).
const navLinks = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { label: "Categories", href: "/categories", icon: Tags },
  { label: "Budget Goals", href: "/budget-goals", icon: Target },
  { label: "Projects", href: "/projects", icon: FolderKanban },
];

export default function Navigation() {
  // usePathname() returns the current URL path (e.g., "/dashboard").
  // We use it to highlight the active nav link.
  const pathname = usePathname();

  // useState(false) creates a boolean state variable.
  // `open` is the current value, `setOpen` is the function to change it.
  const [open, setOpen] = useState(false);

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
          {navLinks.map((link) => {
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
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)} // Close menu after clicking
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
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
