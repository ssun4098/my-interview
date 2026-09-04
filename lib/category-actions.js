'use server';

import { createServerSupabase } from '@/lib/supabase-server';

// 카테고리 읽기/생성은 Server Action 으로만 합니다. 브라우저 Supabase 클라이언트로
// 호출하면 요청이 anon 롤로 나가고, categories 의 RLS 정책은 모두 authenticated
// 대상이라 42501 로 거절됩니다. 서버 클라이언트는 쿠키 세션을 그대로 싣습니다.

const MAX_NAME_LENGTH = 50; // categories_name_len_chk 와 동일

export async function listCategories() {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('categories')
    .select('id, name')
    .order('name', { ascending: true });

  if (error) {
    console.error('카테고리 조회 실패:', error);
    return { error: '카테고리를 불러오지 못했습니다.', categories: [] };
  }

  return { categories: data ?? [] };
}

export async function createCategory(rawName) {
  const name = (rawName ?? '').toString().trim();

  if (!name) {
    return { error: '카테고리 이름을 입력해주세요.' };
  }
  if (name.length > MAX_NAME_LENGTH) {
    return { error: `카테고리 이름은 ${MAX_NAME_LENGTH}자 이하여야 합니다.` };
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('categories')
    .insert({ name })
    .select('id, name')
    .single();

  if (error) {
    // 23505: categories_name_lower_key 위반. 이름만 대소문자가 다른 경우도 여기로
    // 옵니다. 이미 있는 카테고리면 그 행을 돌려줘 사용자가 바로 선택하게 합니다.
    if (error.code === '23505') {
      const { categories } = await listCategories();
      const existing = categories.find(
        (c) => c.name.toLowerCase() === name.toLowerCase(),
      );

      if (existing) return { category: existing, existed: true };
      return { error: '이미 존재하는 카테고리입니다.' };
    }

    console.error('카테고리 생성 실패:', error);
    return { error: '카테고리 생성에 실패했습니다.' };
  }

  return { category: data };
}
