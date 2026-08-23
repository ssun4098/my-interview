'use client';

import Button from '@/components/Button';

export default function ConfirmDeleteForm({
  action,
  confirmMessage,
  children,
  size = 'sm',
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
      style={{ display: 'inline-block', margin: 0 }}
    >
      <Button variant="danger" size={size} type="submit">
        {children}
      </Button>
    </form>
  );
}
