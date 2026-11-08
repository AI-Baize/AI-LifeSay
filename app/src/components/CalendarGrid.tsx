import type { DayAggregate, DayState } from '../domain/history';
import { chinaDay } from '../domain/time';
import { useState } from 'react';

// F-4：学习日历网格（P23）。
// 边界：
// - 四态分开：有记录 / 待补记 / 无记录 / 读取失败；不合并为「有/无」两态。
// - 未知发生时间的记录单列（unknown_date_count），不显示成「完全没有记录」。
// - 无连胜链、无红绿好坏区分、无增长率结论。

export const DAY_STATE_LABEL: Record<DayState, string> = {
  recorded: '有记录',
  pending: '待补记',
  none: '无记录',
  error: '读取失败'
};

export interface CalendarGridProps {
  days: readonly DayAggregate[];
  selected: string | null;
  onSelect: (date: string) => void;
  // 未知发生时间记录数：读取成功但日期未知，不归入任何自然日。
  unknownDateCount: number;
  month: string;
}

export function CalendarGrid({
  days,
  selected,
  onSelect,
  unknownDateCount,
  month
}: CalendarGridProps) {
  const [today]=useState(()=>chinaDay(Date.now()));
  const counts = days.reduce<Record<DayState, number>>(
    (acc, day) => {
      acc[day.state] += 1;
      return acc;
    },
    { recorded: 0, pending: 0, none: 0, error: 0 }
  );

  return (
    <>
      <div className="calendar-weekdays" aria-hidden="true">{['一','二','三','四','五','六','日'].map(d=><span key={d}>{d}</span>)}</div>
      <ul className="card calendar-grid" aria-label={`${month} 日期网格`}>
        {Array.from({length:(new Date(month+"-01T12:00:00Z").getUTCDay()+6)%7},(_,i)=><li key={"blank"+i} aria-hidden="true"/>)}
        {days.map(day => (
          <li key={day.date}>
            <button
              type="button"
              aria-label={`${day.date} ${DAY_STATE_LABEL[day.state]}`}
              aria-pressed={day.date === selected}
              aria-current={day.date===today?'date':undefined}
              data-state={day.state}
              onClick={() => onSelect(day.date)}
            >
              <span>{day.date.slice(8)}</span><small>{DAY_STATE_LABEL[day.state]}</small>
            </button>
          </li>
        ))}
      </ul>
      <section className="card" aria-label="月份状态合计">
        <h2>本月状态合计</h2>
        <p>
          有记录 {counts.recorded} 天／待补记 {counts.pending} 天／无记录 {counts.none} 天／读取失败{' '}
          {counts.error} 天
        </p>
      </section>
      {unknownDateCount > 0 ? (
        <section className="card" aria-label="未知发生时间记录">
          <h2>未知发生时间</h2>
          <p>
            另有 {unknownDateCount} 条记录发生时间未知，未归入任何日期；这是「读取成功但日期未知」，
            不等于「完全没有记录」。
          </p>
        </section>
      ) : null}
      <p className="notice">
        日期标点只表示有记录／待补记／无记录／读取失败四态，不用红绿区别好坏；没有连胜链，也不给增长率结论。
      </p>
    </>
  );
}
