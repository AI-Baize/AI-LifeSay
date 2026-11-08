import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { pendingRecords } from '../domain/parentPlan';
import { useProductStore } from './store';

export default function LegacyEvening() {
  const prefs = useProductStore(s => s.data.prefs), old = useAppStore(s => s.snapshot);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (prefs.daily) void useAppStore.getState().boot();
    const tick = () => setNow(Date.now());
    const timer = setInterval(tick, 15000); window.addEventListener('focus', tick);
    return () => { clearInterval(timer); window.removeEventListener('focus', tick); };
  }, [prefs.daily]);
  const date = new Date(now), [hours = 20, minutes = 0] = prefs.recordTime.split(':').map(Number);
  const rows = pendingRecords(old?.sessions ?? [], now).filter(row => row.selection_snapshot.goal_id && row.course_id && row.unit_id && row.observation_condition_key);
  if (!prefs.daily || date.getHours() * 60 + date.getMinutes() < hours * 60 + minutes || !rows.length) return null;
  return <section className="card"><h2>今晚回看</h2><p>有{rows.length}次旧版真实观察活动可选补记；点读与跟读没有加入评分列表。</p><Link to="/legacy/daily-records">查看可补记活动</Link><p><Link to="/settings">调整时间或关闭每日记录</Link></p></section>;
}
