import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { useRoadmap } from "./store";
import { mergeSyncRecords, syncRecordId, type SyncRecord } from "./syncMerge";
import { supabase, supabaseConfigured } from "./supabase";

export type SyncStatus = "Synced" | "Syncing" | "Offline" | "Error";
type SyncContextValue = {
  status: SyncStatus; email: string | null; configured: boolean; message: string;
  signIn: (email: string) => Promise<void>; signOut: () => Promise<void>; retry: () => Promise<void>;
};
const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<SyncStatus>("Offline");
  const [message, setMessage] = useState("");
  const sessionRef = useRef<Session | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const retrySync = useRef<() => Promise<void>>(async () => {});
  const suppressPush = useRef(false);
  const debounce = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!supabase) return;
    let disposed = false;
    let cleanup = () => {};
    const setup = async () => {
      const client = await supabase;
      if (disposed || !client) return;
      const enqueue = (work: () => Promise<void>) => {
        const next = queue.current.catch(() => {}).then(work);
        queue.current = next;
        return next;
      };
      const reportError = (error: unknown) => {
        if (!disposed) { setStatus("Error"); setMessage(error instanceof Error ? error.message : "Sync failed."); }
      };
      const push = async (userId: string) => {
        if (!navigator.onLine) { setStatus("Offline"); return; }
        setStatus("Syncing");
        const records = Object.values(useRoadmap.getState().syncRecords);
        if (records.length) {
          const { error } = await client.from("records").upsert(
            records.map(({ record_type, record_key, ...record }) => ({ ...record, type: record_type, key: record_key, user_id: userId })),
            { onConflict: "user_id,type,key" },
          );
          if (error) throw error;
        }
        if (!disposed) { setMessage(""); setStatus("Synced"); }
      };
      const synchronize = (userId: string) => enqueue(async () => {
        if (!navigator.onLine) { setStatus("Offline"); return; }
        setStatus("Syncing"); setMessage("");
        const { data, error } = await client.from("records").select("type,key,payload,updated_at");
        if (error) throw error;
        const remote = (data ?? []).map(({ type, key, ...record }: any) => ({ ...record, record_type: type, record_key: key })) as SyncRecord[];
        const local = Object.values(useRoadmap.getState().syncRecords);
        const merged = mergeSyncRecords(local, remote);
        // Seed pre-sync local progress and defaults only when there is no remote version.
        const mergedIds = new Set(merged.map(syncRecordId));
        const at = new Date().toISOString();
        const state = useRoadmap.getState();
        const seed: SyncRecord[] = [
          ...state.tasks.map((task) => ({ record_type: "task" as const, record_key: task.id, payload: { status: task.status, doneAt: task.doneAt, notes: task.notes, proofLink: task.proofLink, minimumPass: task.minimumPass, skippedAt: task.skippedAt }, updated_at: at })),
          ...state.timerSessions.map((s) => ({ record_type: "session" as const, record_key: s.id, payload: { taskId: s.taskId, startedAt: s.startedAt, endedAt: s.endedAt, ...(s.trimmedFrom ? { trimmedFrom: s.trimmedFrom } : {}) }, updated_at: at })),
          ...([ ["strictGates", state.strictGates], ["habitsEnabled", state.habitsEnabled], ["swipeDefaultHome", state.swipeDefaultMobile], ["notifyAtBudget", state.budgetNotifications] ] as const).map(([key, value]) => ({ record_type: "setting" as const, record_key: key, payload: value, updated_at: at })),
          ...Object.entries(state.habits).flatMap(([habit, dates]) => dates.map((date) => ({ record_type: "habit" as const, record_key: `${date}:${habit}`, payload: true, updated_at: at }))),
        ].filter((record) => !mergedIds.has(syncRecordId(record)));
        const all = mergeSyncRecords(merged, seed);
        suppressPush.current = true;
        useRoadmap.getState().applySyncRecords(all);
        suppressPush.current = false;
        await push(userId);
      }).catch((error) => { suppressPush.current = false; reportError(error); throw error; });
      const pushLocal = () => {
        const current = sessionRef.current;
        return current ? enqueue(() => push(current.user.id)).catch((error) => { reportError(error); throw error; }) : Promise.resolve();
      };
      retrySync.current = async () => { const current = sessionRef.current; if (current) await synchronize(current.user.id); };
      const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => {
        sessionRef.current = nextSession; setSession(nextSession);
        if (nextSession) queueMicrotask(() => void synchronize(nextSession.user.id).catch(() => {}));
        else { setStatus("Offline"); setMessage(""); }
      });
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      sessionRef.current = data.session; setSession(data.session);
      if (data.session) void synchronize(data.session.user.id).catch(() => {});
      const unsubscribe = useRoadmap.subscribe((state, previous) => {
        if (state.syncRecords === previous.syncRecords || suppressPush.current || !sessionRef.current) return;
        window.clearTimeout(debounce.current);
        debounce.current = window.setTimeout(() => { void pushLocal().catch(() => {}); }, 1000);
      });
      const pull = () => { const current = sessionRef.current; if (current && document.visibilityState === "visible") void synchronize(current.user.id).catch(() => {}); };
      const online = () => pull();
      const offline = () => setStatus("Offline");
      const interval = window.setInterval(pull, 60000);
      window.addEventListener("online", online); window.addEventListener("offline", offline);
      window.addEventListener("focus", pull); document.addEventListener("visibilitychange", pull);
      cleanup = () => {
        retrySync.current = async () => {};
        window.clearTimeout(debounce.current); window.clearInterval(interval); unsubscribe(); subscription.unsubscribe();
        window.removeEventListener("online", online); window.removeEventListener("offline", offline);
        window.removeEventListener("focus", pull); document.removeEventListener("visibilitychange", pull);
      };
    };
    void setup().catch((error) => { if (!disposed) { setStatus("Error"); setMessage(error instanceof Error ? error.message : "Could not initialize sync."); } });
    return () => { disposed = true; window.clearTimeout(debounce.current); cleanup(); };
  }, []);

  const signIn = async (email: string) => {
    if (!supabase) return;
    const client = await supabase;
    const { error } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    if (error) { setStatus("Error"); setMessage(error.message); throw error; }
    setMessage("Check your email for a sign-in link.");
  };
  const signOut = async () => { if (!supabase) return; const client = await supabase; const { error } = await client.auth.signOut(); if (error) throw error; };
  const retry = async () => { if (!sessionRef.current) return; if (!navigator.onLine) { setStatus("Offline"); return; } try { await retrySync.current(); } catch { /* Status and message are set by the queued operation. */ } };
  return <SyncContext.Provider value={{ status, email: session?.user.email ?? null, configured: supabaseConfigured, message, signIn, signOut, retry }}>{children}</SyncContext.Provider>;
}
export function useSync() { const context = useContext(SyncContext); if (!context) throw new Error("useSync must be used within SyncProvider"); return context; }
