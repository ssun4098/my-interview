import Skeleton from '@/components/Skeleton';
import Card from '@/components/Card';

export default function Loading() {
  return (
    <>
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <Skeleton width="60%" height={26} radius={6} />
        <div style={{ marginTop: 8 }}>
          <Skeleton width="30%" height={14} radius={4} />
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <Skeleton width={128} height={40} radius={12} />
        <Skeleton width={128} height={40} radius={12} />
      </div>
      <Skeleton width={100} height={20} radius={4} />
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 'var(--space-3) 0 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
        }}
      >
        {[0, 1, 2].map((i) => (
          <li key={i}>
            <Card padding="var(--space-3) var(--space-4)">
              <Skeleton width="70%" height={14} radius={4} />
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
