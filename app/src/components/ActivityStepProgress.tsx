export function ActivityStepProgress({ index, total }: { index: number; total: number }) {
  const current = Math.min(Math.max(index + 1, 1), total);
  return (
    <p className="step-progress" aria-label={`第${current}段，共${total}段`}>
      第{current}段，共{total}段
    </p>
  );
}
