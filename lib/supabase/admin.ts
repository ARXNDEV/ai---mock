import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

/**
 * Service-role Supabase client — BYPASSES Row Level Security.
 * Server-only (the `server-only` import prevents it ever shipping to the client).
 * Use exclusively for trusted plan mutations: consuming interview credits and
 * upgrading a user to Pro after a verified payment.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
