'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Card from '@/components/Card';
import Button from '@/components/Button';
import ConfirmDeleteForm from '@/components/ConfirmDeleteForm';
import { EditIcon, TrashIcon } from '@/components/icons';
import { updateQuestionsOrder } from '@/lib/question-actions';

export default function QuestionsList({ setId, questions, isOwner, deleteQuestionBound }) {
  const [items, setItems] = useState(questions);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const dragOverIdx = useRef(null);

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

  return (
    <>
      {!items || items.length === 0 ? (
        <Card padding="var(--space-5)" style={{ textAlign: 'center' }}>
          <p className="muted">아직 문제가 없습니다.</p>
        </Card>
      ) : (
        <>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
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
                  padding="var(--space-3) var(--space-4)"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 'var(--space-3)',
                    background: draggedIdx === idx ? 'var(--color-bg-subtle)' : 'var(--color-bg-surface)',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    {isOwner && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 24,
                          height: 24,
                          cursor: 'grab',
                          color: 'var(--color-fg-3)',
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        ⋮
                      </div>
                    )}
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
                  </div>
                  {isOwner && (
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                      <Link
                        href={`/sets/${setId}/questions/${q.id}/edit`}
                        style={{ textDecoration: 'none' }}
                      >
                        <Button variant="ghost" size="sm">
                          <EditIcon size={14} />
                        </Button>
                      </Link>
                      <ConfirmDeleteForm
                        action={deleteQuestionBound.bind(null, q.id)}
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
      )}
    </>
  );
}
