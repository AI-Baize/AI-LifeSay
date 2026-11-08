import type { PeriodAggregate } from '../domain/history';

// F-4：月/年区间摘要（P24）。
// 边界：
// - interval_days（区间长度）与 covered_days（实际有数据天数）分开；
//   不把整月/整年说成已完整覆盖。
// - 未知发生时间单列（unknown_date_count / ids），不折算为 0。
// - 无积分、无综合分、无增长率结论。

export interface PeriodSummaryProps {
  period: PeriodAggregate;
  // 当前上海自然日，用于提示区间含未来日期。
  today: string;
}

export function PeriodSummary({ period, today }: PeriodSummaryProps) {
  const intervalDays = period.interval_days;
  const coveredDays = period.covered_days;
  return (
    <>
      <section className="card">
        <p>粒度：{period.granularity}</p>
        <p>
          区间：{period.start_date} 至 {period.end_date_exclusive}（不含），共 {intervalDays} 天
        </p>
        <p>
          实际有数据 {coveredDays} 天；活跃 {period.active_days} 天
        </p>
        <p className="notice">
          区间长度 {intervalDays} 天不等于已覆盖 {intervalDays} 天；本页只说明实际有数据的 {coveredDays} 天，
          不把整{period.granularity === 'year' ? '年' : '月'}说成已完整覆盖。
        </p>
        {period.end_date_exclusive > today ? (
          <p className="notice">该区间含未来日期；有效数据截至当前日 {today}。</p>
        ) : null}
      </section>
      <section className="card">
        <h2>描述性分类计数</h2>
        <p>记录 {period.record_count} 条</p>
        <p>
          独立 {period.independent}／提示 {period.prompted}／暂未 {period.not_yet}／未知 {period.unknown}
        </p>
        <p>拒绝 {period.refused}／停止 {period.stopped}（单列，不折算为失败）</p>
        <p className="notice">从发生时间重聚合，不求和周报；没有积分或综合分，也不给增长率结论。</p>
      </section>
      <section className="card" aria-label="未知发生时间记录">
        <h2>未知发生时间</h2>
        {period.unknown_date_count > 0 ? (
          <>
            <p>
              {period.unknown_date_count} 条记录发生时间未知，未归入任何日期；读取成功但日期未知，不等于完全没有记录。
            </p>
            <p className="notice">记录标识：{period.unknown_date_ids.join('、')}</p>
          </>
        ) : (
          <p>本区间没有发生时间未知的记录。</p>
        )}
      </section>
    </>
  );
}
