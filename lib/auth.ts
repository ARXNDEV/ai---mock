import { createClient } from '@/lib/supabase/server';

/** Returns the authenticated user for the current request, or null. */
export async function getUser() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    // Supabase not configured / unreachable — treat as logged out.
    return null;
  }
}
