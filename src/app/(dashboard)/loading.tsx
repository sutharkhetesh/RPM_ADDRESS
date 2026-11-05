export default function Loading() {
  return (
    <div aria-label="Loading workspace" className="space-y-6 animate-pulse">
      <div className="h-10 w-60 bg-muted rounded-lg" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-36 bg-muted rounded-xl" />
        ))}
      </div>
      <div className="h-96 bg-muted rounded-xl" />
    </div>
  );
}
