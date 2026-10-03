import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { useRoadmap } from "./store";
import { mergeSyncRecords, type SyncRecord } from "./syncMerge";
import { supabase, supabaseConfigured } from "./supabase";

export type SyncStatus = "Synced" | "Syncing" | "Offline" | "Error";
type SyncContextValue = {
  status: SyncStatus;
  email: string | null;
  configured: boolean;
  message: string;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  retry: () => Promise<void>;
};

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<SyncStatus>("Offline");
  const [message, setMessage] = useState("");
  const sessionRef = useRef<Session | null>(null);
  const syncing = useRef(false);
  const retrySync = useRef<() => Promise<void>>(async () => {});
  const suppressPush = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!supabase) return;
    let disposed = false;
    let cleanup = () => {};
    const setup = async () => {
      const client = await supabase;
      if (disposed || !client) return;

    const pushLocal = async () => {
      const currentSession = sessionRef.current;
      if (!currentSession) return;
      if (!navigator.onLine) {
        setStatus("Offline");
        return;
      }
      if (syncing.current) {
        timer.current = window.setTimeout(() => {
          void pushLocal().catch((error: unknown) => {
            if (!disposed) {
              setStatus("Error");
              setMessage(error instanceof Error ? error.message : "Sync failed.");
            }
          });
        }, 1000);
        return;
      }
      syncing.current = true;
      setStatus("Syncing");
      try {
        const records = Object.values(useRoadmap.getState().syncRecords);
        if (records.length) {
          const { error } = await client.from("roadmap_records").upsert(
            records.map((record) => ({ ...record, user_id: currentSession.user.id })),
            { onConflict: "user_id,record_type,record_key" },
          );
          if (error) throw error;
        }
        if (!disposed) {
          setMessage("");
          setStatus("Synced");
        }
      } finally {
        syncing.current = false;
      }
    };

    const synchronize = async (userId: string) => {
      if (syncing.current || !navigator.onLine) {
        if (!navigator.onLine) setStatus("Offline");
        return;
      }
      syncing.current = true;
      setStatus("Syncing");
      setMessage("");
      try {
        const { data, error } = await client
          .from("roadmap_records")
          .select("record_type,record_key,payload,updated_at");
        if (error) throw error;
        const remote = (data ?? []) as SyncRecord[];
        const local = Object.values(useRoadmap.getState().syncRecords);
        const merged = mergeSyncRecords(local, remote);
        suppressPush.current = true;
        useRoadmap.getState().applySyncRecords(merged);
        suppressPush.current = false;
        if (merged.length) {
          const { error: pushError } = await client.from("roadmap_records").upsert(
            merged.map((record) => ({ ...record, user_id: userId })),
            { onConflict: "user_id,record_type,record_key" },
          );
          if (pushError) throw pushError;
        }
        if (!disposed) setStatus("Synced");
      } catch (error) {
        suppressPush.current = false;
        if (!disposed) {
          setStatus("Error");
          setMessage(error instanceof Error ? error.message : "Sync failed.");
        }
      } finally {
        syncing.current = false;
      }
    };
    retrySync.current = async () => {
      const currentSession = sessionRef.current;
      if (currentSession) await synchronize(currentSession.user.id);
    };

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      sessionRef.current = nextSession;
      setSession(nextSession);
      if (nextSession) queueMicrotask(() => void synchronize(nextSession.user.id));
      else {
        setStatus("Offline");
        setMessage("");
      }
    });
    void client.auth.getSession().then(({ data, error }) => {
      if (disposed) return;
      if (error) {
        setStatus("Error");
        setMessage(error.message);
        return;
      }
      sessionRef.current = data.session;
      setSession(data.session);
      if (data.session) void synchronize(data.session.user.id);
    });

    const unsubscribe = useRoadmap.subscribe((state, previous) => {
      if (state.syncRecords === previous.syncRecords || suppressPush.current || !sessionRef.current) return;
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        void pushLocal().catch((error: unknown) => {
          if (!disposed) {
            setStatus("Error");
            setMessage(error instanceof Error ? error.message : "Sync failed.");
          }
        });
      }, 1000);
    });
    const online = () => {
      const currentSession = sessionRef.current;
      if (currentSession) void synchronize(currentSession.user.id);
      else setStatus("Offline");
    };
    const offline = () => setStatus("Offline");
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    cleanup = () => {
      retrySync.current = async () => {};
      window.clearTimeout(timer.current);
      unsubscribe();
      subscription.unsubscribe();
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
    };
    void setup().catch((error: unknown) => {
      if (!disposed) {
        setStatus("Error");
        setMessage(error instanceof Error ? error.message : "Could not initialize sync.");
      }
    });
    return () => {
      disposed = true;
      window.clearTimeout(timer.current);
      cleanup();
    };
  }, []);

  const signIn = async (email: string) => {
    if (!supabase) return;
    try {
      const client = await supabase;
      const { error } = await client.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      setMessage("Check your email for a sign-in link.");
    } catch (error) {
      setStatus("Error");
      setMessage(error instanceof Error ? error.message : "Could not send sign-in link.");
      throw error;
    }
  };
  const signOut = async () => {
    if (!supabase) return;
    try {
      const client = await supabase;
      const { error } = await client.auth.signOut();
      if (error) throw error;
    } catch (error) {
      setStatus("Error");
      setMessage(error instanceof Error ? error.message : "Could not sign out.");
      throw error;
    }
  };
  const retry = async () => {
    if (!sessionRef.current) return;
    if (!navigator.onLine) {
      setStatus("Offline");
      return;
    }
    try {
      await retrySync.current();
    } catch (error) {
      setStatus("Error");
      setMessage(error instanceof Error ? error.message : "Sync failed.");
    }
  };

  return (
    <SyncContext.Provider
      value={{ status, email: session?.user.email ?? null, configured: supabaseConfigured, message, signIn, signOut, retry }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) throw new Error("useSync must be used within SyncProvider");
  return context;
}
