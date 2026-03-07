"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface UseAuthOptions {
  redirectTo?: string;
  requireAuth?: boolean;
}

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  supabase: ReturnType<typeof createClient>;
}

export function useAuth(options: UseAuthOptions = {}): UseAuthReturn {
  const { redirectTo = "/login", requireAuth = true } = options;
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (requireAuth && (error || !user)) {
        router.push(redirectTo);
        return;
      }

      setUser(user);
      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase, requireAuth, redirectTo, router]);

  return { user, loading, supabase };
}
