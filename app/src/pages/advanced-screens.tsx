import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { Screen } from './shared';
import { EmptyState } from '../components/EmptyState';
import { StatusNotice } from '../components/StatusNotice';
import { MigrationFailurePanel } from '../components/MigrationFailurePanel';
import { PlanEvaluationPanel } from '../components/PlanEvaluationPanel';
import { GoalSummary } from '../components/GoalSummary';
import { CalendarGrid, DAY_STATE_LABEL } from '../components/CalendarGrid';
import { PeriodSummary } from '../components/PeriodSummary';
import { chinaDay } from '../domain/time';
import { calendarMonth, dayAggregate, periodAggregate } from '../domain/history';
import { entryBandLabel, exposureLabel, suggestEntryBand } from '../domain/entryBand';
import type { DayAggregate, HistoryInput } from '../domain/history';
import type { Snapshot } from '../content/types';

// 方案优化1.2 落地：P19–P24 页面骨架（C-2）+ 历史聚合 UI（C-4/F-4）。
//
// 边界：
// - 未实现的深层逻辑显式标注「未实现」，不假装可用。
// - 不显示积分／综合评分／自动掌握词数／连胜链。
// - 未知或读取失败不折算为 0；四态分开呈现。

function historyInput(snapshot: Snapshot): HistoryInput | null {
  const profileId = snapshot.profile?.id;
  if (!profileId) return null;
  return {
    records: snapshot.records,
    sessions: snapshot.sessions,
    profile_id: profileId
  };
}

function ReadingNotice({ status, snapshot }: { status: string; snapshot: Snapshot | null }) {
  const errorCode = useAppStore(v => v.errorCode);
  if (status === 'loading') return <StatusNotice message="读取本机数据中…" />;
  if (status === 'error' || !snapshot) {
    // C-10/G-4：升级失败给专用提示，不落成普通读取失败文案。
    if (errorCode === 'MIGRATION_FAILED') return <MigrationFailurePanel />;
    return <StatusNotice error message="本机数据读取失败，请重试；不会用空记录替代读取失败。" />;
  }
  return null;
}

// ---------- P19 选择进入方式 ----------
export function EntryScreen() {
  return (
    <Screen title="在这台设备上开始">
      <p>无需账号；学习记录保存在本机。</p>
      <section className="card">
        <h2>在这台设备上开始</h2>
        <p>不需要账号，也不需要手机号；先阅读保存说明，再建立本机演示档案。</p>
        <Link to="/welcome">本机开始</Link>
      </section>
      <section className="card">
        <h2>先看示例</h2>
        <p>只读示例不建立儿童档案，也不保存学习记录；可以随时改为本机开始。</p>
        <Link to="/themes">先看示例</Link>
      </section>
      <p className="notice">演示记录只保存在这台设备，当前不提供跨设备同步。</p>
    </Screen>
  );
}

// ---------- P20 建议学习起点 ----------
export function StartingPointScreen() {
  const status = useAppStore(v => v.status);
  const snapshot = useAppStore(v => v.snapshot);
  const profile = snapshot?.profile ?? null;
  const candidate = suggestEntryBand({
    english_exposure: profile?.english_exposure ?? null,
    preference: profile?.entry_band_preference ?? null
  });

  return (
    <Screen title="这是起步建议，不是测评等级">
      <ReadingNotice status={status} snapshot={snapshot} />
      {!profile ? (
        <EmptyState message="还没有本机档案；从「在这台设备上开始」建立档案后，再看起点建议。" />
      ) : !candidate.ok ? (
        <StatusNotice error message={candidate.error.message} />
      ) : (
        <>
          <section className="card">
            <p>
              建议起点：
              {candidate.data.suggested === null
                ? '尚未判断'
                : `${candidate.data.suggested} · ${entryBandLabel(candidate.data.suggested)}`}
            </p>
            <p>你自选的起点：{entryBandLabel(candidate.data.preference)}</p>
            <p>依据：{candidate.data.explanation_zh}</p>
            <p>你填写的英语接触情况：{exposureLabel(candidate.data.exposure)}</p>
            <p className="notice">
              待验证：目前不提供自动测级，只展示家长已选的信息；没有填写也可以先试一个活动。
            </p>
          </section>
          <section className="card">
            <h2>支持方式单独解释</h2>
            <p>
              支持档（一起说／先等再帮／换个场景）与 E 级相互独立，不自动换算；
              年龄也不单独推断能力或起点。
            </p>
            <p className="notice">当前暂不提供起点测级或资料编辑；可以先试一个活动，再调整帮助方式。</p>
          </section>
          <p>
            <Link to="/themes">浏览可用活动</Link>
          </p>
          <p>
            <Link to="/themes">先试一个入门活动</Link>
          </p>
        </>
      )}
    </Screen>
  );
}

// ---------- P21 可选评估 ----------
export function ReviewScreen(){
 const {sessionId}=useParams();const snapshot=useAppStore(v=>v.snapshot);
 const session=snapshot?.sessions.find(x=>x.id===sessionId&&x.deleted_at===null);
 return <Screen title="这次安排合适吗？可以跳过">{session?<><GoalSummary selection={session.selection_snapshot}/><PlanEvaluationPanel key={session.id} sessionId={session.id} recordId={session.record_id} level={session.selection_snapshot.level}/><Link to={'/results/'+chinaDay(session.ended_at??session.started_at)}>完成，查看当天记录</Link></>:<EmptyState message="没有找到这次活动；无法评估不存在的活动。"/>}</Screen>;
}

// ---------- P22 当天学习情况 ----------
export function DayResultScreen() {
  const { date } = useParams();
  const status = useAppStore(v => v.status);
  const snapshot = useAppStore(v => v.snapshot);
  const input = snapshot ? historyInput(snapshot) : null;
  const day = input && date ? dayAggregate({ ...input, date }) : null;

  return (
    <Screen title={date?date+"的活动与观察":"活动与观察"}>
      <ReadingNotice status={status} snapshot={snapshot} />
      {!input ? (
        <EmptyState message="还没有本机档案，无法按日汇总；不创建空档案。" />
      ) : !date || !day ? (
        <EmptyState message="无法打开此内容；请从历史日历进入。" />
      ) : !day.ok ? (
        <StatusNotice error message={day.error.message} />
      ) : (
        <DayBody day={day.data} />
      )}
      <p>
        <Link to="/history/calendar">回到学习日历</Link>
      </p>
    </Screen>
  );
}

function DayBody({ day }: { day: DayAggregate }) {
  const selection = useAppStore(v => v.snapshot?.profile?.selection ?? null);
  return (
    <>
      <section className="card">
        <p>
          {day.date} · 本机演示数据（非真实记录）
        </p>
        <p>状态：{DAY_STATE_LABEL[day.state]}</p>
      </section>
      <section className="card">
        <h2>活动事实</h2>
        <p>开始的活动：{day.session_count} 次</p>
        <p>已提交记录：{day.record_count} 条</p>
        <p className="notice">活动事实是行为计数，不是能力评分。</p>
      </section>
      <section className="card">
        <h2>观察结果</h2>
        <p>
          独立 {day.independent}／提示 {day.prompted}／暂未 {day.not_yet}／未知 {day.unknown}
        </p>
        <p>
          拒绝 {day.refused}／停止 {day.stopped}（单列，不折算为失败）
        </p>
        <p className="notice">没有积分，也没有综合分；未知不按 0 计。</p>
      </section>
      {day.state === 'pending' ? (
        <section className="card">
          <h2>待补记</h2>
          <p>有已开始但未提交记录的活动，可继续补记；不生成虚假的成功或未知事实。</p>
          <Link to="/records">去补记这次活动</Link>
        </section>
      ) : null}
      {day.state === 'none' ? (
        <EmptyState message="这一天还没有已提交的记录。" />
      ) : null}
      <section className="card">
        <h2>下一次</h2>
        {selection ? (
          <Link to="/activity/prepare">准备亲子活动</Link>
        ) : (
          <p>尚未确认目标，先选一个场景。</p>
        )}
        <p className="notice">查看不会修改目标。</p>
      </section>
    </>
  );
}

// ---------- P23 学习日历 ----------
function monthShift(month: string, delta: number): string {
  const year = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  const total = year * 12 + (m - 1) + delta;
  const nextYear = Math.floor(total / 12);
  const nextMonth = (total % 12) + 1;
  return `${String(nextYear).padStart(4, '0')}-${String(nextMonth).padStart(2, '0')}`;
}

export function CalendarScreen() {
  const status = useAppStore(v => v.status);
  const snapshot = useAppStore(v => v.snapshot);
  const [today] = useState(() => chinaDay(Date.now()));
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selected, setSelected] = useState(today);
  const input = snapshot ? historyInput(snapshot) : null;
  const grid = input ? calendarMonth({ ...input, month }) : null;
  const day = input ? dayAggregate({ ...input, date: selected }) : null;
  // R04：未知发生时间单列（读取成功但日期未知），不显示成「完全没有记录」。
  const unknownDateCount = day && day.ok ? day.data.unknown_date_count : 0;

  return (
    <Screen title="学习日历">
      <ReadingNotice status={status} snapshot={snapshot} />
      {!input ? (
        <EmptyState message="还没有本机档案，无法显示日历。" />
      ) : !grid || !grid.ok ? (
        <StatusNotice error message={grid && !grid.ok ? grid.error.message : '读取失败'} />
      ) : (
        <>
          <nav className="card month-navigation" aria-label="月份导航">
            <button onClick={() => {const next=monthShift(month,-1);setMonth(next);setSelected(next+'-01');}}>上一月</button>
            <span>{month}</span><button onClick={()=>{setMonth(today.slice(0,7));setSelected(today);}}>今天</button>
            <button onClick={() => {const next=monthShift(month,1);setMonth(next);setSelected(next+'-01');}}>下一月</button>
          </nav>
          <CalendarGrid
            days={grid.data}
            selected={selected}
            onSelect={setSelected}
            unknownDateCount={unknownDateCount}
            month={month}
          />
          <section className="card">
            <h2>选中日摘要</h2>
            {day && day.ok ? (
              <>
                <p>
                  {day.data.date}：{DAY_STATE_LABEL[day.data.state]}
                </p>
                <p>
                  活动 {day.data.session_count} 次／记录 {day.data.record_count} 条；独立{' '}
                  {day.data.independent}／提示 {day.data.prompted}／暂未 {day.data.not_yet}／未知{' '}
                  {day.data.unknown}
                </p>
                <Link to={`/results/${day.data.date}`}>查看当天学习情况</Link>
              </>
            ) : (
              <StatusNotice error message="这一天读取失败，不显示为空。" />
            )}
          </section>
          <section className="card">
            <h2>切换粒度</h2>
            <Link to={`/results/${selected}`}>日</Link>
            <p>
              <Link to="/reports">周（周报）</Link>
            </p>
            <p>
              <Link to={`/history/period/month/${month}`}>月</Link>
            </p>
            <p>
              <Link to={`/history/period/year/${month.slice(0, 4)}`}>年</Link>
            </p>
          </section>
        </>
      )}
    </Screen>
  );
}

// ---------- P24 月／年 ----------
export function PeriodScreen() {
  const { granularity, periodKey } = useParams();
  const status = useAppStore(v => v.status);
  const snapshot = useAppStore(v => v.snapshot);
  const input = snapshot ? historyInput(snapshot) : null;
  const [today] = useState(() => chinaDay(Date.now()));
  const allowed = granularity === 'month' || granularity === 'year';
  const period =
    input && allowed && periodKey
      ? periodAggregate({ ...input, granularity, period_key: periodKey })
      : null;

  return (
    <Screen title={granularity === 'year' ? '年度学习情况' : '月度学习情况'}>
      <ReadingNotice status={status} snapshot={snapshot} />
      {!allowed ? (
        <EmptyState message="无法打开此内容：粒度仅支持 month 或 year。" />
      ) : !input ? (
        <EmptyState message="还没有本机档案，无法按月／年汇总。" />
      ) : !period || !period.ok ? (
        <StatusNotice error message={period && !period.ok ? period.error.message : '无法打开此内容'} />
      ) : (
        <>
          <PeriodSummary period={period.data} today={today} />
          <section className="card">
            <h2>可比组与日明细</h2>
            <Link to="/reports/history">历史周报（可比组）</Link>
            <p>
              <Link to="/history/calendar">回到学习日历（日明细入口）</Link>
            </p>
          </section>
          <p><Link to="/records">按主题查看活动明细与待补记</Link></p>
        </>
      )}
    </Screen>
  );
}
