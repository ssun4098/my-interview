'use client';

import { motion } from 'motion/react';
import { SPRING } from '@/lib/motion';

const SIZES = {
  sm: { height: 36, padding: '0 14px', fontSize: 13 },
  md: { height: 44, padding: '0 20px', fontSize: 14 },
  lg: { height: 52, padding: '0 24px', fontSize: 15 },
};

function variantStyle(variant) {
  switch (variant) {
    case 'ghost':
      return {
        background: 'var(--color-bg-subtle)',
        color: 'var(--color-fg-1)',
        border: '1px solid var(--color-border-2)',
      };
    case 'danger':
      return {
        background: 'transparent',
        color: 'var(--color-danger)',
        border: '1px solid var(--color-border-2)',
      };
    case 'link':
      return {
        background: 'transparent',
        color: 'var(--color-link)',
        border: '1px solid transparent',
      };
    case 'green':   // legacy alias → maps to primary (Toss blue)
    case 'mint':    // legacy alias → maps to primary
    case 'white':   // legacy alias → light button on dark bg
      if (variant === 'white') {
        return {
          background: 'var(--color-bg-inverse)',
          color: 'var(--color-fg-inverse)',
          border: '1px solid var(--color-bg-inverse)',
        };
      }
      // fall through to primary
    case 'primary':
    default:
      return {
        background: 'var(--color-primary)',
        color: 'var(--color-fg-1)',
        border: '1px solid var(--color-primary)',
      };
  }
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  type = 'button',
  onClick,
  children,
  style,
  ...rest
}) {
  const sizeStyle = SIZES[size] ?? SIZES.md;
  const vStyle = variantStyle(variant);

  const merged = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
    borderRadius: 'var(--radius-md)',
    fontWeight: 600,
    letterSpacing: 0,
    whiteSpace: 'nowrap',
    userSelect: 'none',
    ...sizeStyle,
    ...vStyle,
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    width: fullWidth ? '100%' : undefined,
    ...style,
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={SPRING.micro}
      style={merged}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
