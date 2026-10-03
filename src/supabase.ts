const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey);
export const supabase = url && anonKey
	? import("@supabase/supabase-js").then(({ createClient }) => createClient(url, anonKey))
	: null;
