export default function Card({
  as = 'div',
  padding = 'var(--space-5)',
  radius = 'var(--radius-lg)',   /* 16px — chunky Toss card */
  shadow = 'none',
  border = true,
  style,
  children,
  ...rest
}) {
  const Tag = as;
  return (
    <Tag
      style={{
        background: 'var(--color-bg-surface)',
        borderRadius: radius,
        padding,
        boxShadow: shadow === 'none' ? undefined : shadow,
        border: border ? '1px solid var(--color-border-1)' : 'none',
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
