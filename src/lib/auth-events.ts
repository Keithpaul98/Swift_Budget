import { createClient } from "@/lib/supabase";

export type AuthEventType = "password_reset" | "password_change" | "login" | "logout" | "signup";

// Logs an auth event to user_auth_events table
export async function logAuthEvent(
  userId: string,
  eventType: AuthEventType,
  metadata: Record<string, unknown> = {}
) {
  try {
    const supabase = createClient();
    await supabase.from("user_auth_events").insert({
      user_id: userId,
      event_type: eventType,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      metadata,
    });
  } catch (err) {
    // Silent fail — don't affect user experience
    console.debug("Auth event log failed:", err);
  }
}
