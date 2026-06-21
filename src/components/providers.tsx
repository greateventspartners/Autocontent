"use client";

import { createClientSupabaseClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { useEffect, createContext, useContext, useState } from "react";
import type { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, loading: true });

export function useUser() {
  return useContext(AuthContext);
}

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    const supabase = createClientSupabaseClient();

    const getInitialSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setState({ user, loading: false });
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, loading: false });
      router.refresh();
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  );
}
