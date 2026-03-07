"use client";

// =============================================================================
// Signup Page
// =============================================================================
// "use client" because this page uses interactive features (forms, state).
//
// KEY CONCEPTS FOR BEGINNERS:
// - useState: Stores form data (email, password, username) in component memory
// - Form submission: Prevents default browser behavior, calls Supabase instead
// - Error handling: Shows user-friendly messages if signup fails
// - Redirect: Sends user to dashboard after successful signup
// =============================================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Wallet, Loader2 } from "lucide-react";

export default function SignupPage() {
  // Router for navigation after signup
  const router = useRouter();

  // Form state — stores what the user types
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  // UI state — shows loading spinner and error messages
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle form submission
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault(); // Stop browser from reloading the page
    setError(null); // Clear any previous errors
    setLoading(true); // Show loading spinner

    try {
      const supabase = createClient();

      // Call Supabase Auth to create a new user
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username, // Store username in user metadata
          },
        },
      });

      if (signupError) {
        // Show error message to user
        setError(signupError.message);
        setLoading(false);
        return;
      }

      // Success! Redirect to dashboard
      // Note: Supabase may require email confirmation depending on your settings
      if (data.user) {
        router.push("/dashboard");
      }
    } catch (err) {
      // Catch any unexpected errors
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Wallet className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Create an account</CardTitle>
          </div>
          <CardDescription>
            Enter your details below to create your SwiftBudget account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            {/* Error message */}
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Username field */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Email field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 6 characters
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            {/* Submit button */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Creating account..." : "Sign up"}
            </Button>

            {/* Link to login page */}
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-primary hover:underline"
              >
                Log in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
