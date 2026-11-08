import type { Outcome } from '../content/types';
const OPTIONS: { value: Outcome; label: string }[] = [
  { value: 'independent', label: '独立完成' },
  { value: 'prompted', label: '提示后完成' },
  { value: 'not_yet', label: '还没有' }
];
export function ObservationOptionGroup({
  value,
  disabled = false,
  onChange
}: {
  value: Outcome | null | undefined;
  disabled?: boolean;
  onChange: (v: Outcome | null) => void;
}) {
  return (
    <fieldset disabled={disabled}>
      <legend>这次的表现</legend>
      {OPTIONS.map(option => (
        <label key={option.value}>
          <input
            type="radio"
            name="outcome"
            checked={value === option.value}
            disabled={disabled}
            onChange={() => onChange(option.value)}
          />
          {option.label}
        </label>
      ))}
      <label>
        <input
          type="radio"
          name="outcome"
          checked={value === null}
          disabled={disabled}
          onChange={() => onChange(null)}
        />
        没看清／不确定（记为未知）
      </label>
      {disabled && <p>请先选择参与状态。</p>}
    </fieldset>
  );
}
