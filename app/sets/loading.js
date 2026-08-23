import Skeleton from '@/components/Skeleton';
import Card from '@/components/Card';

export default function Loading() {
  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-5)',
        }}
      >
        <Skeleton width={120} height={26} radius={6} />
        <Skeleton width={100} height={36} radius={12} />
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
              <Skeleton width="60%" height={16} radius={4} />
              <div style={{ marginTop: 8 }}>
                <Skeleton width="30%" height={12} radius={4} />
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
