import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t py-6 mt-12">
      <div className="container mx-auto flex flex-col items-center gap-2 px-4 sm:flex-row sm:justify-between">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} SwiftBudget. All rights reserved.
        </p>
        <div className="flex gap-4">
          <Link
            href="/privacy"
            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            Terms of Service
          </Link>
          <Link
            href="/contact"
            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
