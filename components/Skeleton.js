export default function Skeleton({ width = '100%', height, radius = 4, style }) {
  return (
    <div
      className="skeleton"
      style={{
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
    />
  );
}
