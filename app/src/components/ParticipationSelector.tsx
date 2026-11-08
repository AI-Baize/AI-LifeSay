import type { Participation } from '../content/types';
const OPTIONS: { value: Participation; label: string }[] = [
  { value: 'engaged', label: '参与了' },
  { value: 'stopped', label: '中途停止' },
  { value: 'refused', label: '明确拒绝' }
];
export function ParticipationSelector({
  value,
  onChange
}: {
  value: Participation | null;
  onChange: (v: Participation) => void;
}) {
  return (
    <fieldset>
      <legend>孩子的参与状态</legend>
      {OPTIONS.map(option => (
        <label key={option.value}>
          <input
            type="radio"
            name="participation"
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          {option.label}
        </label>
      ))}
      <p>参与状态与表现分开记录；改为未参与时会清空表现结果。</p>
    </fieldset>
  );
}
