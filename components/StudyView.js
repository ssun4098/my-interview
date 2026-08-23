'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Chip from '@/components/Chip';
import { SPRING } from '@/lib/motion';

const cardVariants = {
  enter: (dir) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

export default function StudyView({ questions, mode, initialIndex = 0, backHref }) {
  const total = questions.length;
  const safeInitial = Math.max(0, Math.min(initialIndex, total));
  const [index, setIndex] = useState(safeInitial);
  const [revealed, setRevealed] = useState(false);
  const [direction, setDirection] = useState(1);   // 1 = forward, -1 = back

  if (index >= total) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING.page}
      >
        <Card
          padding="var(--space-8)"
          style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-5)',
          }}
        >
          <div style={{ fontSize: 17, color: 'var(--color-fg-2)' }}>
            학습 완료했습니다.
          </div>
          {backHref && (
            <Link href={backHref} style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="md">
                문제집으로 돌아가기
              </Button>
            </Link>
          )}
        </Card>
      </motion.div>
    );
  }

  const question = questions[index];
  const showBody = mode === 'study' || revealed;

  function goNext() {
    setDirection(1);
    setRevealed(false);
    setIndex((i) => i + 1);
  }
  function goPrev() {
    if (index === 0) return;
    setDirection(-1);
    setRevealed(false);
    setIndex((i) => i - 1);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div
        style={{
          fontSize: 12,
          color: 'var(--color-fg-3)',
          textAlign: 'center',
        }}
      >
        {index + 1} / {total} · {mode === 'study' ? '학습 모드' : '암기 모드'}
      </div>

      <AnimatePresence mode="popLayout" custom={direction} initial={false}>
        <motion.div
          key={question.id}
          custom={direction}
          variants={cardVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={SPRING.page}
        >
          <Card
            padding="var(--space-5)"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
              minHeight: 240,
            }}
          >
            <h2 style={{ fontSize: 20, lineHeight: 1.35 }}>{question.title}</h2>

            {showBody ? (
              <>
                <div
                  style={{
                    whiteSpace: 'pre-wrap',
                    fontSize: 15,
                    lineHeight: 1.65,
                    color: 'var(--color-fg-2)',
                  }}
                >
                  {question.content}
                </div>
                {question.keywords && question.keywords.length > 0 && (
                  <div
                    aria-label="키워드"
                    style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}
                  >
                    {question.keywords.map((k, i) => (
                      <Chip key={`${k}-${i}`} label={k} variant="primary" />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div>
                <Button variant="ghost" size="sm" onClick={() => setRevealed(true)}>
                  내용 보기
                </Button>
              </div>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>

      <div
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Button variant="ghost" size="md" onClick={goPrev} disabled={index === 0}>
          이전
        </Button>
        {backHref && (
          <Link
            href={backHref}
            style={{
              fontSize: 13,
              color: 'var(--color-fg-3)',
              padding: '0 var(--space-3)',
            }}
          >
            목록으로
          </Link>
        )}
        <Button variant="primary" size="md" onClick={goNext}>
          {index === total - 1 ? '완료' : '다음'}
        </Button>
      </div>
    </div>
  );
}
