import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import { deleteSet } from '@/lib/set-actions';
import { deleteQuestion } from '@/lib/question-actions';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Chip from '@/components/Chip';
import ConfirmDeleteForm from '@/components/ConfirmDeleteForm';
import { EditIcon, TrashIcon, PlusIcon } from '@/components/icons';

export default async function SetDetailPage({ params }) {
  const { id } = params;
  const supabase = createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: set } = await supabase
    .from('question_sets')
    .select('id, title, is_public, owner_id, owner:profiles ( username )')
    .eq('id', id)
    .maybeSingle();

  if (!set) notFound();

  const isOwner = user && set.owner_id === user.id;

  const { data: questions } = await supabase
    .from('questions')
    .select('id, title, keywords, created_at')
    .eq('question_set_id', id)
    .order('created_at', { ascending: true });

  const deleteSetBound = deleteSet.bind(null, id);

  return (
    <>
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            marginBottom: 4,
            flexWrap: 'wrap',
          }}
        >
          <h1 style={{ minWidth: 0 }}>{set.title}</h1>
          <Chip
            label={set.is_public ? '공개' : '비공개'}
            variant={set.is_public ? 'mint' : 'default'}
          />
        </div>
        {!isOwner && (
          <p className="muted">by {set.owner?.username ?? '알 수 없음'}</p>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          flexWrap: 'wrap',
          marginBottom: 'var(--space-5)',
        }}
      >
        <Link href={`/sets/${id}/study?mode=study&i=0`} style={{ textDecoration: 'none' }}>
          <Button variant="primary" size="md">학습 모드로 열기</Button>
        </Link>
        <Link href={`/sets/${id}/study?mode=memorize&i=0`} style={{ textDecoration: 'none' }}>
          <Button variant="ghost" size="md">암기 모드로 열기</Button>
        </Link>
      </div>

      {isOwner && (
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-2)',
            flexWrap: 'wrap',
            marginBottom: 'var(--space-6)',
          }}
        >
          <Link href={`/sets/${id}/edit`} style={{ textDecoration: 'none' }}>
            <Button variant="ghost" size="sm">
              <EditIcon size={14} />
              문제집 편집
            </Button>
          </Link>
          <ConfirmDeleteForm
            action={deleteSetBound}
            confirmMessage="이 문제집과 모든 문제를 삭제할까요?"
          >
            <TrashIcon size={14} />
            문제집 삭제
          </ConfirmDeleteForm>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-3)',
          gap: 'var(--space-3)',
        }}
      >
        <h2>문제 ({questions?.length ?? 0})</h2>
        {isOwner && (
          <Link href={`/sets/${id}/questions/new`} style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="sm">
              <PlusIcon size={14} />
              새 문제
            </Button>
          </Link>
        )}
      </div>

      {!questions || questions.length === 0 ? (
        <Card padding="var(--space-5)" style={{ textAlign: 'center' }}>
          <p className="muted">아직 문제가 없습니다.</p>
        </Card>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
          }}
        >
          {questions.map((q, idx) => (
            <li key={q.id}>
              <Card
                padding="var(--space-3) var(--space-4)"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'var(--space-3)',
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--color-fg-1)',
                    }}
                  >
                    <span
                      style={{ color: 'var(--color-fg-3)', marginRight: 6, fontWeight: 500 }}
                    >
                      {idx + 1}.
                    </span>
                    {q.title}
                  </div>
                  {q.keywords && q.keywords.length > 0 && (
                    <div className="muted" style={{ marginTop: 2, fontSize: 12 }}>
                      키워드 {q.keywords.length}개
                    </div>
                  )}
                </div>
                {isOwner && (
                  <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                    <Link
                      href={`/sets/${id}/questions/${q.id}/edit`}
                      style={{ textDecoration: 'none' }}
                    >
                      <Button variant="ghost" size="sm">
                        <EditIcon size={14} />
                      </Button>
                    </Link>
                    <ConfirmDeleteForm
                      action={deleteQuestion.bind(null, id, q.id)}
                      confirmMessage="이 문제를 삭제할까요?"
                    >
                      <TrashIcon size={14} />
                    </ConfirmDeleteForm>
                  </div>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
