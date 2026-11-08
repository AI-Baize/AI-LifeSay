export function WeekSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label>
      选择周（周一）
      <input type="date" value={value} onChange={e => onChange(e.target.value)} />
    </label>
  );
}
