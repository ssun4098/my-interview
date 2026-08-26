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

function readFields(formData) {
  const title = (formData.get('title') ?? '').toString().trim();
  const content = (formData.get('content') ?? '').toString();
  const keywords = normalizeKeywords(formData.get('keywords'));
  const categories = normalizeCategories(formData.get('categories'));
  return { title, content, keywords, categories };
}

export async function createQuestion(setId, formData) {
  const { title, content, keywords, categories } = readFields(formData);

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

  const { data: questionData, error } = await supabase
    .from('questions')
    .insert({ question_set_id: setId, title, content, keywords, order: newOrder })
    .select('id');

  if (error) return { error: '문제 생성에 실패했습니다.' };

  // 카테고리 추가
  if (categories.length > 0 && questionData && questionData[0]) {
    const questionId = questionData[0].id;
    const categoryInserts = categories.map(categoryId => ({
      question_id: questionId,
      category_id: categoryId,
    }));

    const { error: categoryError } = await supabase
      .from('question_categories')
      .insert(categoryInserts);

    if (categoryError) {
      console.error('카테고리 추가 실패:', categoryError);
      // 카테고리 실패는 경고만 하고 계속 진행
    }
  }

  revalidatePath(`/sets/${setId}`);
  redirect(`/sets/${setId}`);
}

export async function updateQuestion(setId, questionId, formData) {
  const { title, content, keywords, categories } = readFields(formData);

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

  // 기존 카테고리 제거 후 새 카테고리 추가
  await supabase
    .from('question_categories')
    .delete()
    .eq('question_id', questionId);

  if (categories.length > 0) {
    const categoryInserts = categories.map(categoryId => ({
      question_id: questionId,
      category_id: categoryId,
    }));

    const { error: categoryError } = await supabase
      .from('question_categories')
      .insert(categoryInserts);

    if (categoryError) {
      console.error('카테고리 수정 실패:', categoryError);
    }
  }

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
