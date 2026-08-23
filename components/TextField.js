'use client';

import { useState } from 'react';

export default function TextField({
  label,
  error,
  type = 'text',
  as = 'input',
  rows = 4,
  style,
  ...inputProps
}) {
  const [focused, setFocused] = useState(false);

  const wrapperStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
    width: '100%',
  };

  const labelStyle = {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--color-fg-2)',
  };

  const focusRing = focused && !error
    ? { boxShadow: 'var(--glow-primary)', borderColor: 'var(--color-primary)' }
    : {};

  const baseFieldStyle = {
    width: '100%',
    padding: as === 'textarea' ? 'var(--space-3) var(--space-4)' : '0 var(--space-4)',
    height: as === 'textarea' ? undefined : 48,
    minHeight: as === 'textarea' ? 120 : undefined,
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-bg-surface)',
    border: error
      ? '1.5px solid var(--color-danger)'
      : '1px solid var(--color-border-2)',
    outline: 'none',
    color: 'var(--color-fg-1)',
    fontFamily: 'inherit',
    lineHeight: as === 'textarea' ? 1.5 : undefined,
    resize: as === 'textarea' ? 'vertical' : undefined,
    transition: 'border-color 120ms var(--ease-out), box-shadow 120ms var(--ease-out)',
    ...focusRing,
    ...style,
  };

  const errorStyle = {
    fontSize: 12,
    color: 'var(--color-danger)',
  };

  const commonProps = {
    ...inputProps,
    style: baseFieldStyle,
    onFocus: (e) => {
      setFocused(true);
      inputProps.onFocus?.(e);
    },
    onBlur: (e) => {
      setFocused(false);
      inputProps.onBlur?.(e);
    },
  };

  return (
    <label style={wrapperStyle}>
      {label && <span style={labelStyle}>{label}</span>}
      {as === 'textarea' ? (
        <textarea rows={rows} {...commonProps} />
      ) : (
        <input type={type} {...commonProps} />
      )}
      {error && <span style={errorStyle}>{error}</span>}
    </label>
  );
}
