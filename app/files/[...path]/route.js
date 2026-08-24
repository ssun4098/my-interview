import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { QUESTION_FILES_BUCKET } from '@/lib/storage';

// Stable proxy URL embedded in question content HTML (see lib/storage.js).
// The `question-files` bucket is private, so every view resolves a fresh
// short-lived signed URL here instead of us persisting one — Supabase
// enforces the storage RLS policy (owner or public set) against the
// caller's session cookie on every request.
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const path = params.path?.join('/');
  if (!path) {
    return new NextResponse('Not found', { status: 404 });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase.storage
    .from(QUESTION_FILES_BUCKET)
    .createSignedUrl(path, 60);

  if (error || !data?.signedUrl) {
    return new NextResponse('Not found', { status: 404 });
  }

  return NextResponse.redirect(data.signedUrl);
}
