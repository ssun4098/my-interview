'use server';

import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import { createAdminSupabase } from '@/lib/supabase-admin';
import { normalize, isValid, toEmail } from '@/lib/username';

const GENERIC_LOGIN_ERROR = '아이디 또는 비밀번호가 올바르지 않습니다.';

export async function signUp(formData) {
  const rawUsername = formData.get('username');
  const password = formData.get('password');
  const username = normalize(rawUsername);

  if (!isValid(username)) {
    return {
      error:
        '사용할 수 없는 아이디 형식입니다. 소문자·숫자·._- 만 사용해 3~32자로 입력해 주세요.',
    };
  }
  if (!password || password.length < 8) {
    return { error: '비밀번호는 8자 이상이어야 합니다.' };
  }

  const admin = createAdminSupabase();
  const email = toEmail(username);

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    console.error('[signUp] admin.createUser error:', {
      status: error.status,
      code: error.code,
      message: error.message,
    });
    const msg = error.message || '';
    if (/already been registered|already exists|user_already_exists|duplicate/i.test(msg)) {
      return { error: '이미 사용 중인 아이디입니다.' };
    }
    if (/leaked|pwned|compromised|weak_password/i.test(msg)) {
      return {
        error:
          '이 비밀번호는 유출된 적이 있어 사용할 수 없습니다. 다른 비밀번호를 사용해 주세요.',
      };
    }
    if (/invalid.*email|email.*invalid/i.test(msg)) {
      return { error: '아이디 형식이 거부되었습니다.' };
    }
    return { error: `가입 실패: ${msg || '알 수 없는 오류'}` };
  }

  const userId = data?.user?.id;
  if (!userId) {
    return { error: '사용자 생성 후 ID를 받지 못했습니다.' };
  }

  const { error: profileError } = await admin
    .from('profiles')
    .insert({ id: userId, username });

  if (profileError) {
    console.error('[signUp] profile insert error:', profileError);
    await admin.auth.admin.deleteUser(userId);
    if (profileError.code === '23505') {
      return { error: '이미 사용 중인 아이디입니다.' };
    }
    return { error: '프로필 생성 중 문제가 발생했습니다.' };
  }

  redirect('/login?signedUp=1');
}

export async function signIn(formData) {
  const username = normalize(formData.get('username'));
  const password = formData.get('password') ?? '';
  const next = formData.get('next') || '/sets';

  if (!username || !password) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  const supabase = createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({
    email: toEmail(username),
    password,
  });

  if (error) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_approved')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || profile.is_approved !== true) {
      await supabase.auth.signOut();
      return {
        error: '아직 승인되지 않은 계정입니다. 관리자에게 문의해 주세요.',
      };
    }
  } else {
    return { error: GENERIC_LOGIN_ERROR };
  }

  redirect(typeof next === 'string' && next.startsWith('/') ? next : '/sets');
}

export async function signOut() {
  const supabase = createServerSupabase();
  await supabase.auth.signOut();
  redirect('/login');
}
