'use client';

import { CloseIcon } from '@/components/icons';

function variantStyle(variant) {
  switch (variant) {
    case 'primary':
    case 'mint':      // legacy alias
    case 'blurple':   // legacy alias
      return {
        background: 'var(--color-primary-tint)',
        color: 'var(--color-primary-hover)',
      };
    case 'danger':
      return {
        background: 'var(--color-danger-tint)',
        color: 'var(--color-danger)',
      };
    case 'success':
    case 'green':     // legacy alias
      return {
        background: 'var(--color-success-tint)',
        color: 'var(--color-success)',
      };
    case 'default':
    default:
      return {
        background: 'var(--color-bg-subtle)',
        color: 'var(--color-fg-2)',
      };
  }
}

export default function Chip({
  label,
  variant = 'default',
  onRemove,
  removeLabel,
}) {
  const vStyle = variantStyle(variant);

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-1)',
        padding: '3px 10px',
        borderRadius: 'var(--radius-pill)',
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1.4,
        letterSpacing: 0.1,
        ...vStyle,
      }}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel || `${label} 제거`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            padding: 0,
            marginLeft: 2,
            color: 'currentColor',
            opacity: 0.7,
            cursor: 'pointer',
          }}
        >
          <CloseIcon size={12} />
        </button>
      )}
    </span>
  );
}
