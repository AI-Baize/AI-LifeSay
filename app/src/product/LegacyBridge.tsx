import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppRoutes } from '../routes/router';
import { useAppStore } from '../stores/appStore';
import DataSettingsPage from '../pages/DataSettingsPage';
import { useProductStore } from './store';
import { DailyRecordsScreen } from '../pages/parent-screens';
import { useLearningStore } from '../stores/learningStore';

// This module is lazy and is excluded from the market-free build. Existing
// observation contracts and data retain their historical meaning and identity.
export default function LegacyBridge() {
  const status = useAppStore(s => s.status), snapshot = useAppStore(s => s.snapshot);
  const location = useLocation(), [message, setMessage] = useState('');
  const prefs = useProductStore(s => s.data.prefs);
  useEffect(() => { void useAppStore.getState().boot(); }, []);
  useEffect(() => {
    if (!snapshot?.profile || location.pathname === '/legacy/migrate') return;
    if (snapshot.settings?.daily_record_enabled !== prefs.daily || snapshot.settings?.daily_record_time !== prefs.recordTime)
      void useLearningStore.getState().saveRecordPreferences(prefs.daily, prefs.recordTime);
  }, [snapshot?.profile, snapshot?.settings, prefs.daily, prefs.recordTime, location.pathname]);
  if (status === 'error') return <section><h1>旧版本资料读取失败</h1><p>原资料未被替换。</p><button onClick={() => void useAppStore.getState().boot()}>重新读取</button></section>;
  if (status !== 'ready') return <p>读取旧版本资料…</p>;
  if (location.pathname === '/legacy/daily-records' || location.pathname === '/daily-records') return <DailyRecordsScreen/>;
  if (location.pathname === '/legacy/data') return <><Link to="/settings/data">返回本版本资料</Link><DataSettingsPage/></>;
  if (location.pathname === '/legacy/migrate') return <section><h1>复制旧周目标与偏好</h1><p>旧观察和成绩不会转成点读体验。缺保存时间的周目标将标注时间未知，不自动删除。</p><button onClick={() => {
    const store = useProductStore.getState();
    if (!store.migrateGoals(snapshot?.profile?.weekly_goals ?? {}, snapshot?.profile?.weekly_goal_saved_at ?? {})) return;
    const old = snapshot?.settings;
    if (store.preferences({ auto: old?.scene_autoplay ?? true, daily: old?.daily_record_enabled ?? true, recordTime: old?.daily_record_time ?? '20:00' })) setMessage('复制完成。旧资料保留，原观察记录没有变化。');
  }}>复制到本版本</button><p role="status">{message}</p><Link to="/me">返回我的</Link></section>;
  return <><p className="notice">旧版资料与观察流程。其记录不会由新版本点读或跟读自动生成。</p><AppRoutes/></>;
}
