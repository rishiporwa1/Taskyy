// Supabase client configured for Clerk JWT integration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.warn(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Please verify your .env configuration."
  );
}

// Fallback to empty string if missing so createClient does not crash module evaluation prematurely
export const supabase = createClient<Database>(
  SUPABASE_URL || "",
  SUPABASE_PUBLISHABLE_KEY || "",
  {
    global: {
      fetch: async (url, options: RequestInit = {}) => {
        const headers = new Headers(options.headers);

        if (typeof window !== "undefined" && (window as any).Clerk) {
          try {
            const session = (window as any).Clerk.session;
            if (session) {
              const token = await session.getToken({ template: "supabase" });
              if (token) {
                headers.set("Authorization", `Bearer ${token}`);
              }
            }
          } catch (e) {
            console.error("Error retrieving Clerk token for Supabase request:", e);
          }
        }

        return fetch(url, {
          ...options,
          headers,
        });
      },
    },
  }
);