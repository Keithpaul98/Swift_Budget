import { createBrowserClient } from "@supabase/ssr";

// This creates a Supabase client for use in the browser (client components).
// It reads the URL and key from your .env.local file.
// The "NEXT_PUBLIC_" prefix means these values are safe to expose in the browser.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
