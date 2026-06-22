import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

/**
 * Refreshes the Supabase auth session on every request and returns the
 * response (with refreshed cookies) plus the current user (or null).
 */
export async function updateSession(
  request: NextRequest,
): Promise<{ response: NextResponse; user: User | null }> {
  const response = NextResponse.next({ request });

  // Degrade gracefully if Supabase isn't configured yet (treat as logged out)
  // instead of throwing on every request.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { response, user: null };
  }

  return updateSessionWithSupabase(request, response);
}

async function updateSessionWithSupabase(
  request: NextRequest,
  initialResponse: NextResponse,
): Promise<{ response: NextResponse; user: User | null }> {
  let response = initialResponse;

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
