'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase-server';

function normalizeKeywords(raw) {
  let arr;
  try {
    arr = JSON.parse(raw ?? '[]');
  } catch {
    arr = [];
  }
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  const out = [];
  for (const item of arr) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

function readFields(formData) {
  const title = (formData.get('title') ?? '').toString().trim();
  const content = (formData.get('content') ?? '').toString();
  const keywords = normalizeKeywords(formData.get('keywords'));
  return { title, content, keywords };
}

export async function createQuestion(setId, formData) {
  const { title, content, keywords } = readFields(formData);

  if (!title || title.length > 200) {
    return { error: '제목은 1~200자여야 합니다.' };
  }
  if (content.length > 20000) {
    return { error: '내용은 20000자 이하여야 합니다.' };
  }

  const supabase = createServerSupabase();

  // 최대 order 값을 가져와서 새 order 값 결정
  const { data: maxOrderData } = await supabase
    .from('questions')
    .select('"order"')
    .eq('question_set_id', setId)
    .order('"order"', { ascending: false })
    .limit(1);

  const newOrder = (maxOrderData && maxOrderData[0]?.order) ? maxOrderData[0].order + 1 : 0;

  const { error } = await supabase
    .from('questions')
    .insert({ question_set_id: setId, title, content, keywords, order: newOrder });

  if (error) return { error: '문제 생성에 실패했습니다.' };

  revalidatePath(`/sets/${setId}`);
  redirect(`/sets/${setId}`);
}

export async function updateQuestion(setId, questionId, formData) {
  const { title, content, keywords } = readFields(formData);

  if (!title || title.length > 200) {
    return { error: '제목은 1~200자여야 합니다.' };
  }
  if (content.length > 20000) {
    return { error: '내용은 20000자 이하여야 합니다.' };
  }

  const supabase = createServerSupabase();
  const { error } = await supabase
    .from('questions')
    .update({ title, content, keywords })
    .eq('id', questionId);

  if (error) return { error: '수정에 실패했습니다.' };

  revalidatePath(`/sets/${setId}`);
  redirect(`/sets/${setId}`);
}

export async function deleteQuestion(setId, questionId) {
  const supabase = createServerSupabase();
  const { error } = await supabase.from('questions').delete().eq('id', questionId);
  if (error) return { error: '삭제에 실패했습니다.' };
  revalidatePath(`/sets/${setId}`);
}

export async function updateQuestionsOrder(setId, reorderedIds) {
  const supabase = createServerSupabase();

  // 각 문제의 order를 업데이트
  for (let i = 0; i < reorderedIds.length; i++) {
    await supabase
      .from('questions')
      .update({ order: i })
      .eq('id', reorderedIds[i]);
  }

  revalidatePath(`/sets/${setId}`);
}
