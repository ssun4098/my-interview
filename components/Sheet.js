'use client';

import { motion, AnimatePresence } from 'motion/react';
import { SPRING } from '@/lib/motion';

export default function Sheet({ open, onClose, children }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            onClick={onClose}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.55)',
              zIndex: 60,
            }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={SPRING.sheet}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) onClose?.();
            }}
            style={{
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              maxHeight: '80vh',
              background: 'var(--color-bg-elevated)',
              borderRadius: 'var(--radius-sheet) var(--radius-sheet) 0 0',
              padding: 'var(--space-5)',
              paddingBottom: 'calc(var(--space-5) + env(safe-area-inset-bottom))',
              zIndex: 65,
              overflowY: 'auto',
              boxShadow: 'var(--shadow-3)',
            }}
          >
            {/* grab handle */}
            <div
              aria-hidden="true"
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                background: 'var(--color-border-2)',
                margin: '0 auto var(--space-4)',
              }}
            />
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
