'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase-server';

function parseTitle(formData) {
  const title = (formData.get('title') ?? '').toString().trim();
  return title;
}

export async function createSet(formData) {
  const title = parseTitle(formData);
  const is_public = formData.get('is_public') === 'on';

  if (!title || title.length > 200) {
    return { error: '제목은 1~200자여야 합니다.' };
  }

  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다.' };

  const { data, error } = await supabase
    .from('question_sets')
    .insert({ title, is_public, owner_id: user.id })
    .select('id')
    .single();

  if (error) return { error: '문제집 생성에 실패했습니다.' };

  redirect(`/sets/${data.id}`);
}

export async function updateSet(setId, formData) {
  const title = parseTitle(formData);
  const is_public = formData.get('is_public') === 'on';

  if (!title || title.length > 200) {
    return { error: '제목은 1~200자여야 합니다.' };
  }

  const supabase = createServerSupabase();
  const { error } = await supabase
    .from('question_sets')
    .update({ title, is_public })
    .eq('id', setId);

  if (error) return { error: '수정에 실패했습니다.' };

  revalidatePath(`/sets/${setId}`);
  redirect(`/sets/${setId}`);
}

export async function deleteSet(setId) {
  const supabase = createServerSupabase();
  const { error } = await supabase.from('question_sets').delete().eq('id', setId);
  if (error) return { error: '삭제에 실패했습니다.' };
  revalidatePath('/sets');
  redirect('/sets');
}
