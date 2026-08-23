import Skeleton from '@/components/Skeleton';

export default function Loading() {
  return (
    <>
      <Skeleton width="55%" height={26} radius={6} />
      <div style={{ marginTop: 8, marginBottom: 'var(--space-6)' }}>
        <Skeleton width="35%" height={14} radius={4} />
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <Skeleton width={128} height={40} radius={12} />
        <Skeleton width={128} height={40} radius={12} />
        <Skeleton width={92} height={40} radius={12} />
      </div>
    </>
  );
}
