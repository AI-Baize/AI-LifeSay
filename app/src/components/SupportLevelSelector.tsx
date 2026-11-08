import type { Level } from '../content/types';
const OPTIONS: { level: Level; label: string; detail: string }[] = [
  { level: 0, label: '一起说', detail: '家长示范为主，孩子跟随。' },
  { level: 1, label: '先等再帮', detail: '先等待，再给必要提示。' },
  { level: 2, label: '换个场景', detail: '在生活场景中尝试独立表达。' }
];
export function SupportLevelSelector({ value, onChange }: { value: Level | null; onChange: (v: Level) => void }) {
  return (
    <fieldset>
      <legend>选择这次的支持方式</legend>
      {OPTIONS.map(option => (
        <label key={option.level}>
          <input
            type="radio"
            name="support-level"
            checked={value === option.level}
            onChange={() => onChange(option.level)}
          />
          {option.label}：{option.detail}
        </label>
      ))}
      <p>不显示积分或综合评分；三档为产品假设，不是官方等级。</p>
    </fieldset>
  );
}
