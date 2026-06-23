import { NextResponse } from 'next/server';
import { toFile } from 'openai';
import { getGroq, GROQ_WHISPER_MODEL } from '@/lib/groq';
import { getUser } from '@/lib/auth';
import { spendInterviewCall } from '@/lib/entitlements';

export const runtime = 'nodejs';
// Transcription of a short answer comfortably fits well under this ceiling.
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const spend = await spendInterviewCall(request, user.id);
    if (!spend.ok) return NextResponse.json({ error: spend.error }, { status: spend.status });

    const formData = await request.formData();
    const audio = formData.get('audio');

    if (!(audio instanceof Blob)) {
      return NextResponse.json({ error: 'No audio file was provided.' }, { status: 400 });
    }

    const buffer = Buffer.from(await audio.arrayBuffer());
    const type = audio.type || 'audio/webm';
    const ext =
      type.includes('mp4') || type.includes('mpeg')
        ? 'mp4'
        : type.includes('ogg')
          ? 'ogg'
          : 'webm';

    const file = await toFile(buffer, `answer.${ext}`, { type });

    const transcription = await getGroq().audio.transcriptions.create({
      file,
      model: GROQ_WHISPER_MODEL,
    });

    return NextResponse.json({ transcript: transcription.text });
  } catch (err) {
    console.error('[transcribe] error:', err);
    const detail = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to transcribe audio: ${detail}` },
      { status: 500 },
    );
  }
}
