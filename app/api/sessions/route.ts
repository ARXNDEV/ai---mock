import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/database.types';

export const runtime = 'nodejs';

interface Body {
  role?: string;
  difficulty?: string;
  overall_score?: number;
  questions?: Json;
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body || !body.role || !body.difficulty || typeof body.overall_score !== 'number') {
    return NextResponse.json({ error: 'Invalid session payload.' }, { status: 400 });
  }

  // RLS guarantees the row is created for this user only.
  const { error } = await supabase.from('sessions').insert({
    user_id: user.id,
    role: body.role,
    difficulty: body.difficulty,
    overall_score: body.overall_score,
    questions: body.questions ?? [],
  });

  if (error) {
    console.error('[sessions] insert failed', error);
    return NextResponse.json({ error: 'Failed to save session.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
