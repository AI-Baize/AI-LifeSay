import { DAY_MS, chinaDay, latestActive } from "./next-step";
import { weekInterval } from "./time";
import {
  fail,
  isInstant,
  ok,
  type ActivityRecord,
  type Instant,
  type Result,
  type SessionFactSource
} from "../content/types";

// 历史聚合：日 / 日历 / 周 / 月 / 年统一口径（Asia/Shanghai）。
// 不新增物理表：月/年由 records 的 occurred_at 直接派生（C-11），
// 不复用 reports 的 weekly 唯一索引。
//
// 口径约束：
// - 未知发生时间（occurred_at 非法）单列，不归入任何自然日。
// - 软删除后按最新 revision 重算，删除记录不参与计数。
// - 读取失败由调用方呈现为 error，不转换成 0。

export type HistoryGranularity = "month" | "year";
export type PeriodGranularity = "week" | HistoryGranularity;
export type DayState = "recorded" | "pending" | "none" | "error";

// R05：可补记的活动状态（区分删除/放弃）。
export const PENDING_SESSION_STATUSES = [
  "active",
  "paused",
  "awaiting_record",
  "pending_record"
] as const;

// 会话聚合源类型统一由 content/types 声明，含身份与状态。
export type { SessionFactSource };

export interface DayAggregate {
  date: string;
  state: DayState;
  session_count: number;
  record_count: number;
  independent: number;
  prompted: number;
  not_yet: number;
  unknown: number;
  refused: number;
  stopped: number;
  total_seconds: number | null;
  duration_complete: boolean;
  evidence_ids: string[];
  // R04：发生时间未知的记录单列，不归入任何自然日，也不折算为 0。
  unknown_date_count: number;
  unknown_date_ids: string[];
}

export interface PeriodAggregate {
  granularity: PeriodGranularity;
  period_key: string;
  start_date: string;
  end_date_exclusive: string;
  // R06：interval_days 是区间长度；covered_days 是实际有数据的天数。
  interval_days: number;
  covered_days: number;
  record_count: number;
  active_days: number;
  independent: number;
  prompted: number;
  not_yet: number;
  unknown: number;
  refused: number;
  stopped: number;
  total_seconds: number | null;
  duration_complete: boolean;
  evidence_ids: string[];
  unknown_date_count: number;
  unknown_date_ids: string[];
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;
const YEAR_RE = /^\d{4}$/;

function validDate(date: string): boolean {
  if (!DATE_RE.test(date)) return false;
  const parsed = Date.parse(`${date}T00:00:00.000Z`);
  return (
    Number.isFinite(parsed) &&
    new Date(parsed).toISOString().slice(0, 10) === date
  );
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function monthDayList(key: string): string[] | null {
  if (!MONTH_RE.test(key)) return null;
  const year = Number(key.slice(0, 4));
  const month = Number(key.slice(5, 7));
  if (month < 1 || month > 12) return null;
  const total = daysInMonth(year, month);
  const out: string[] = [];
  for (let day = 1; day <= total; day += 1) {
    out.push(`${key}-${String(day).padStart(2, "0")}`);
  }
  return out;
}

function rangeDays(startDate: string, endDateExclusive: string): string[] {
  const start = Date.parse(`${startDate}T00:00:00.000Z`);
  const end = Date.parse(`${endDateExclusive}T00:00:00.000Z`);
  const out: string[] = [];
  for (let t = start; t < end; t += DAY_MS) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

// 上海自然日 [00:00, 次日 00:00) 的 UTC 边界。
export function shanghaiDayStart(date: string): Instant | null {
  if (!validDate(date)) return null;
  return Date.parse(`${date}T00:00:00.000Z`) - 8 * 3600000;
}

function sameId(a: SessionFactSource, b: SessionFactSource): boolean {
  return a.revision > b.revision ||
    (a.revision === b.revision && a.updated_at > b.updated_at);
}

function latestSessions(rows: readonly SessionFactSource[]): SessionFactSource[] {
  const map = new Map<string, SessionFactSource>();
  for (const row of rows) {
    const previous = map.get(row.id);
    if (!previous || sameId(row, previous)) map.set(row.id, row);
  }
  return [...map.values()].filter(row => row.deleted_at === null);
}

export interface HistoryInput {
  records: readonly ActivityRecord[];
  sessions: readonly SessionFactSource[];
  profile_id: string;
}

interface Facts {
  independent: number;
  prompted: number;
  not_yet: number;
  unknown: number;
  refused: number;
  stopped: number;
  total_seconds: number | null;
  duration_complete: boolean;
  evidence_ids: string[];
}

function countFacts(rows: readonly ActivityRecord[]): Facts {
  const observed = rows.filter(r => r.outcome !== null);
  const durationsComplete = rows.length > 0 &&
    rows.every(r => r.duration_seconds !== null);
  return {
    independent: observed.filter(r => r.outcome === "independent").length,
    prompted: observed.filter(r => r.outcome === "prompted").length,
    not_yet: observed.filter(r => r.outcome === "not_yet").length,
    unknown: rows.filter(
      r =>
        r.outcome === null &&
        r.participation !== "refused" &&
        r.participation !== "stopped"
    ).length,
    refused: rows.filter(r => r.participation === "refused").length,
    stopped: rows.filter(r => r.participation === "stopped").length,
    total_seconds: durationsComplete
      ? rows.reduce((sum, r) => sum + (r.duration_seconds ?? 0), 0)
      : null,
    duration_complete: durationsComplete,
    evidence_ids: observed.map(r => r.id)
  };
}

// 记录分桶：未知发生时间单独返回，不归入录入日。
export function splitByOccurredAt(
  records: readonly ActivityRecord[]
): { known: ActivityRecord[]; unknown: ActivityRecord[] } {
  const known: ActivityRecord[] = [];
  const unknown: ActivityRecord[] = [];
  for (const row of records) {
    if (isInstant(row.occurred_at)) known.push(row);
    else unknown.push(row);
  }
  return { known, unknown };
}

function ownActive(input: HistoryInput): {
  records: ActivityRecord[];
  sessions: SessionFactSource[];
  unknown: ActivityRecord[];
} {
  const active = latestActive(input.records).filter(
    r => r.profile_id === input.profile_id
  );
  const split = splitByOccurredAt(active);
  return {
    records: split.known,
    unknown: split.unknown,
    sessions: latestSessions(input.sessions).filter(
      s => s.profile_id === input.profile_id
    )
  };
}

function inRange(time: Instant, start: Instant, end: Instant): boolean {
  return time >= start && time < end;
}

export function dayAggregate(
  input: HistoryInput & { date: string }
): Result<DayAggregate> {
  const start = shanghaiDayStart(input.date);
  if (start === null || !input.profile_id.trim()) {
    return fail("INVALID_INPUT", "请提供有效的自然日与档案 ID。");
  }
  const end = start + DAY_MS;
  const own = ownActive(input);
  const rows = own.records.filter(r => inRange(r.occurred_at, start, end));
  const facts = countFacts(rows);
  // R05：只有可补记状态才算待补记；删除/放弃不显示为待补记。
  const sessions = own.sessions.filter(
    s =>
      isInstant(s.started_at) &&
      inRange(s.started_at, start, end) &&
      PENDING_SESSION_STATUSES.includes(
        s.status as (typeof PENDING_SESSION_STATUSES)[number]
      )
  ).length;
  return ok({
    date: input.date,
    state: rows.length > 0 ? "recorded" : sessions > 0 ? "pending" : "none",
    session_count: sessions,
    record_count: rows.length,
    ...facts,
    unknown_date_count: own.unknown.length,
    unknown_date_ids: own.unknown.map(r => r.id)
  });
}

export function calendarMonth(
  input: HistoryInput & { month: string }
): Result<DayAggregate[]> {
  const days = monthDayList(input.month);
  if (!days || !input.profile_id.trim()) {
    return fail("INVALID_INPUT", "请提供有效的月份与档案 ID。");
  }
  const out: DayAggregate[] = [];
  for (const date of days) {
    const day = dayAggregate({ ...input, date });
    if (!day.ok) return day;
    out.push(day.data);
  }
  return ok(out);
}

function periodBounds(
  granularity: HistoryGranularity,
  key: string
): { start_date: string; end_date_exclusive: string; days: string[] } | null {
  if (granularity === "month") {
    const days = monthDayList(key);
    if (!days) return null;
    const year = Number(key.slice(0, 4));
    const month = Number(key.slice(5, 7));
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    return {
      start_date: `${key}-01`,
      end_date_exclusive: `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`,
      days
    };
  }
  if (!YEAR_RE.test(key)) return null;
  const year = Number(key);
  return {
    start_date: `${key}-01-01`,
    end_date_exclusive: `${year + 1}-01-01`,
    days: rangeDays(`${key}-01-01`, `${year + 1}-01-01`)
  };
}

export function periodAggregate(
  input: HistoryInput & { granularity: string; period_key: string }
): Result<PeriodAggregate> {
  if (input.granularity !== "month" && input.granularity !== "year") {
    return fail("INVALID_INPUT", "周期仅支持 month 或 year。");
  }
  const bounds = periodBounds(input.granularity, input.period_key);
  if (!bounds || !input.profile_id.trim()) {
    return fail("INVALID_INPUT", "请提供有效的周期与档案 ID。");
  }
  // bounds 已校验为合法的 4 位日期，边界一定有限。
  const start = Date.parse(`${bounds.start_date}T00:00:00.000Z`) - 8 * 3600000;
  const endExclusive = Date.parse(`${bounds.end_date_exclusive}T00:00:00.000Z`) - 8 * 3600000;
  const own = ownActive(input);
  const rows = own.records.filter(
    r => inRange(r.occurred_at, start, endExclusive)
  );
  const facts = countFacts(rows);
  const activeDays = new Set(rows.map(r => chinaDay(r.occurred_at))).size;
  return ok({
    granularity: input.granularity,
    period_key: input.period_key,
    start_date: bounds.start_date,
    end_date_exclusive: bounds.end_date_exclusive,
    // R06：区间长度与实际覆盖天数分开，不把整月/整年说成已完整覆盖。
    interval_days: bounds.days.length,
    covered_days: activeDays,
    record_count: rows.length,
    active_days: activeDays,
    ...facts,
    unknown_date_count: own.unknown.length,
    unknown_date_ids: own.unknown.map(r => r.id)
  });
}

// 周聚合：周一开始的上海自然周；与既有一级周报口径一致。
export function weekAggregate(
  input: HistoryInput & { week_start: string }
): Result<PeriodAggregate> {
  const interval = weekInterval(input.week_start);
  if (!interval || !input.profile_id.trim()) {
    return fail("INVALID_INPUT", "请提供有效的周一日期与档案 ID。");
  }
  const startDate = chinaDay(interval.start);
  const endDateExclusive = chinaDay(interval.end);
  const days = rangeDays(startDate, endDateExclusive);
  const own = ownActive(input);
  const rows = own.records.filter(
    r => inRange(r.occurred_at, interval.start, interval.end)
  );
  const facts = countFacts(rows);
  const activeDays = new Set(rows.map(r => chinaDay(r.occurred_at))).size;
  return ok({
    granularity: "week",
    period_key: input.week_start,
    start_date: startDate,
    end_date_exclusive: endDateExclusive,
    interval_days: days.length,
    covered_days: activeDays,
    record_count: rows.length,
    active_days: activeDays,
    ...facts,
    unknown_date_count: own.unknown.length,
    unknown_date_ids: own.unknown.map(r => r.id)
  });
}
