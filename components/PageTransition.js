'use client';

import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { usePathname } from 'next/navigation';
import { useRouteDirection, useIsMobile, SPRING } from '@/lib/motion';

const desktopVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -6 },
};

function mobileVariantsFor(direction) {
  if (direction === 'sibling') {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit:    { opacity: 0 },
    };
  }
  if (direction === 'back') {
    return {
      initial: { x: '-30%', opacity: 0.6 },
      animate: { x: 0, opacity: 1 },
      exit:    { x: '100%', opacity: 0.6 },
    };
  }
  // forward (default)
  return {
    initial: { x: '100%', opacity: 0.6 },
    animate: { x: 0, opacity: 1 },
    exit:    { x: '-30%', opacity: 0.6 },
  };
}

export default function PageTransition({ children }) {
  const pathname = usePathname();
  const direction = useRouteDirection();
  const isMobile = useIsMobile();
  const reduce = useReducedMotion();

  const variants = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : isMobile
      ? mobileVariantsFor(direction)
      : desktopVariants;

  const transition = reduce
    ? { duration: 0 }
    : isMobile
      ? SPRING.page
      : { duration: 0.2, ease: [0.16, 1, 0.3, 1] };

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={pathname}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        transition={transition}
        style={{ width: '100%', position: 'relative', background: 'var(--color-bg-page)' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
