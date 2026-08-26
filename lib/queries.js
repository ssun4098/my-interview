export async function getQuestionSetForStudy(supabase, setId) {
  const { data: set, error: setError } = await supabase
    .from('question_sets')
    .select('id, title, is_public, owner_id, owner:profiles ( username )')
    .eq('id', setId)
    .maybeSingle();

  if (setError || !set) return null;

  const { data: questions, error: qError } = await supabase
    .from('questions')
    .select('id, title, content, keywords, created_at, "order", question_categories ( category_id, categories ( id, name ) )')
    .eq('question_set_id', setId)
    .order('"order"', { ascending: true });

  if (qError) return null;

  // 카테고리 구조 정규화
  const normalizedQuestions = (questions ?? []).map(q => ({
    ...q,
    categories: q.question_categories?.map(qc => qc.categories) ?? [],
  }));

  return { set, questions: normalizedQuestions };
}
