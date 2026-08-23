export async function getCurrentProfile(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('id, username, is_approved')
    .eq('id', user.id)
    .maybeSingle();

  return data ?? null;
}
