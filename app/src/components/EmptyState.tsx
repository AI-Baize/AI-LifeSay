export function EmptyState({ message }: { message: string }) {
  return (
    <div className="card">
      <p>{message}</p>
    </div>
  );
}
