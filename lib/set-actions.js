'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase-server';

function parseTitle(formData) {
  const title = (formData.get('title') ?? '').toString().trim();
  return title;
}

function normalizeCategories(raw) {
  let arr;
  try {
    arr = JSON.parse(raw ?? '[]');
  } catch {
    arr = [];
  }
  if (!Array.isArray(arr)) return [];
  return arr.filter(id => typeof id === 'string' && id.trim());
}

export async function createSet(formData) {
  const title = parseTitle(formData);
  const is_public = formData.get('is_public') === 'on';
  const categories = normalizeCategories(formData.get('categories'));

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

  const setId = data.id;

  // 카테고리 추가
  if (categories.length > 0) {
    const categoryInserts = categories.map(categoryId => ({
      question_set_id: setId,
      category_id: categoryId,
    }));

    const { error: categoryError } = await supabase
      .from('question_set_categories')
      .insert(categoryInserts);

    if (categoryError) {
      console.error('문제집 카테고리 추가 실패:', categoryError);
    }
  }

  redirect(`/sets/${setId}`);
}

export async function updateSet(setId, formData) {
  const title = parseTitle(formData);
  const is_public = formData.get('is_public') === 'on';
  const categories = normalizeCategories(formData.get('categories'));

  if (!title || title.length > 200) {
    return { error: '제목은 1~200자여야 합니다.' };
  }

  const supabase = createServerSupabase();
  const { error } = await supabase
    .from('question_sets')
    .update({ title, is_public })
    .eq('id', setId);

  if (error) return { error: '수정에 실패했습니다.' };

  // 기존 카테고리 제거 후 새 카테고리 추가
  await supabase
    .from('question_set_categories')
    .delete()
    .eq('question_set_id', setId);

  if (categories.length > 0) {
    const categoryInserts = categories.map(categoryId => ({
      question_set_id: setId,
      category_id: categoryId,
    }));

    const { error: categoryError } = await supabase
      .from('question_set_categories')
      .insert(categoryInserts);

    if (categoryError) {
      console.error('문제집 카테고리 수정 실패:', categoryError);
    }
  }

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
