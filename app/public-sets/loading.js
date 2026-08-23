import Skeleton from '@/components/Skeleton';
import Card from '@/components/Card';

export default function Loading() {
  return (
    <>
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <Skeleton width={140} height={26} radius={6} />
      </div>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
        }}
      >
        {[0, 1, 2].map((i) => (
          <li key={i}>
            <Card padding="var(--space-4)">
              <Skeleton width="55%" height={16} radius={4} />
              <div style={{ marginTop: 8 }}>
                <Skeleton width="40%" height={12} radius={4} />
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
