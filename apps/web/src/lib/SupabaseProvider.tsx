import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { ensureSupabaseSession } from "./ensureSupabaseSession";
import { isSupabaseConfigured } from "./supabaseClient";

interface SupabaseContextValue {
  userId: string | null;
  ready: boolean;
  configured: boolean;
}

const SupabaseContext = createContext<SupabaseContextValue>({
  userId: null,
  ready: false,
  configured: false,
});

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(!configured);

  useEffect(() => {
    if (!configured) return;

    let cancelled = false;
    void ensureSupabaseSession().then((id) => {
      if (cancelled) return;
      setUserId(id);
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [configured]);

  return (
    <SupabaseContext.Provider value={{ userId, ready, configured }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabaseSession(): SupabaseContextValue {
  return useContext(SupabaseContext);
}
