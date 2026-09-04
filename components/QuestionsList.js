'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { EditIcon, TrashIcon } from '@/components/icons';
import { updateQuestionsOrder, deleteQuestion } from '@/lib/question-actions';

export default function QuestionsList({ setId, questions, isOwner }) {
  const [items, setItems] = useState(questions);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const dragOverIdx = useRef(null);

  async function handleDeleteQuestion(questionId) {
    if (!confirm('이 문제를 삭제할까요?')) {
      return;
    }

    try {
      await deleteQuestion(setId, questionId);
      // 삭제 성공 후 UI에서 제거
      setItems(items.filter(q => q.id !== questionId));
    } catch (error) {
      console.error('문제 삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  }

  async function handleDragEnd() {
    setDraggedIdx(null);
    dragOverIdx.current = null;

    // 순서가 변경되었으면 서버에 업데이트
    const originalIds = questions.map(q => q.id);
    const newIds = items.map(q => q.id);
    const hasChanged = originalIds.some((id, idx) => id !== newIds[idx]);

    if (hasChanged) {
      setIsSaving(true);
      try {
        await updateQuestionsOrder(setId, newIds);
      } finally {
        setIsSaving(false);
      }
    }
  }

  function handleDragStart(idx) {
    setDraggedIdx(idx);
  }

  function handleDragOver(idx) {
    if (draggedIdx === null || draggedIdx === idx) return;

    const newItems = [...items];
    const draggedItem = newItems[draggedIdx];
    newItems.splice(draggedIdx, 1);
    newItems.splice(idx, 0, draggedItem);
    setItems(newItems);
    setDraggedIdx(idx);
  }

  if (!items || items.length === 0) {
    return (
      <Card padding="var(--space-5)" style={{ textAlign: 'center' }}>
        <p className="muted">아직 문제가 없습니다.</p>
      </Card>
    );
  }

  return (
    <>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 'var(--space-3)',
          opacity: isSaving ? 0.6 : 1,
          transition: 'opacity 200ms',
        }}
      >
        {items.map((q, idx) => (
          <li
            key={q.id}
            draggable={isOwner}
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => {
              e.preventDefault();
              handleDragOver(idx);
            }}
            onDragEnd={handleDragEnd}
            onDragLeave={() => {
              dragOverIdx.current = null;
            }}
            style={{
              cursor: isOwner ? 'grab' : 'default',
              opacity: draggedIdx === idx ? 0.5 : 1,
              transition: 'opacity 150ms, background 150ms',
            }}
          >
            <Card
              padding="var(--space-4)"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
                height: '100%',
                background: draggedIdx === idx ? 'var(--color-bg-subtle)' : 'var(--color-bg-surface)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'var(--space-2)',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 22,
                    height: 22,
                    padding: '0 6px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'var(--color-bg-subtle)',
                    color: 'var(--color-fg-3)',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {idx + 1}
                </span>
                {isOwner && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 24,
                      height: 20,
                      cursor: 'grab',
                      color: 'var(--color-fg-3)',
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                    aria-label="드래그하여 순서 변경"
                  >
                    ⋮⋮
                  </div>
                )}
              </div>

              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: 'var(--color-fg-1)',
                  lineHeight: 1.4,
                  flex: 1,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {q.title}
              </div>

              {(q.categories?.length > 0 || q.keywords?.length > 0) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
                  {q.categories?.map(cat => (
                    <span
                      key={cat.id}
                      style={{
                        display: 'inline-block',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--color-primary-tint)',
                        color: 'var(--color-primary)',
                        fontSize: 11,
                        fontWeight: 500,
                      }}
                    >
                      {cat.name}
                    </span>
                  ))}
                  {q.keywords?.length > 0 && (
                    <span className="muted" style={{ fontSize: 11 }}>
                      키워드 {q.keywords.length}개
                    </span>
                  )}
                </div>
              )}

              {isOwner && (
                <div style={{ display: 'flex', gap: 'var(--space-1)', marginTop: 'auto', paddingTop: 'var(--space-1)' }}>
                  <Link
                    href={`/sets/${setId}/questions/${q.id}/edit`}
                    style={{ textDecoration: 'none', flex: 1 }}
                  >
                    <Button variant="ghost" size="sm" fullWidth>
                      <EditIcon size={14} />
                    </Button>
                  </Link>
                  <Button
                    variant="danger"
                    size="sm"
                    type="button"
                    onClick={() => handleDeleteQuestion(q.id)}
                    fullWidth
                  >
                    <TrashIcon size={14} />
                  </Button>
                </div>
              )}
            </Card>
          </li>
        ))}
      </ul>
      {isSaving && (
        <div
          style={{
            marginTop: 'var(--space-3)',
            fontSize: 13,
            color: 'var(--color-fg-3)',
            textAlign: 'center',
          }}
        >
          순서 저장 중…
        </div>
      )}
    </>
  );
}
