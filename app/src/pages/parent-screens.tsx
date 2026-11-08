import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { useLearningStore } from '../stores/learningStore';
import { eveningReady, localDate, localWeek, pendingRecords, retainedWeeklyGoals, weeklyGoalExpiresAt } from '../domain/parentPlan';
import { Screen, useAction } from './shared';
function useClock(){const [now,setNow]=useState(()=>Date.now());useEffect(()=>{const tick=()=>setNow(Date.now());const id=setInterval(tick,15000);window.addEventListener('focus',tick);return()=>{clearInterval(id);window.removeEventListener('focus',tick);};},[]);return now;}
export function EveningRecords(){const s=useAppStore(v=>v.snapshot),now=useClock();const rows=pendingRecords(s?.sessions??[],now);if(!rows.length||!eveningReady(s?.settings,now))return null;return <section className="card" aria-label="晚间表现记录"><h2>今晚，回看今天的表现</h2><p>有{rows.length}次活动可以记录，包含之前未补记的活动。</p><Link className="button-link primary" to="/daily-records">记录表现</Link><p><Link to="/settings/records">调整时间／关闭每日记录</Link></p></section>;}
export function WeeklyGoalScreen(){
 const p=useAppStore(v=>v.snapshot?.profile),a=useAction(),[week,setWeek]=useState(()=>localWeek(Date.now()));const [draft,setDraft]=useState<string|null>(null),[saved,setSaved]=useState(false);
 const goals=retainedWeeklyGoals(p),value=draft??goals[week]??'';
 const recent=Object.entries(goals).sort(([a],[b])=>b.localeCompare(a));
 useEffect(()=>{if(p)void useLearningStore.getState().pruneExpiredWeeklyGoals();},[p?.id]);
 const cancel=()=>{setDraft(null);setSaved(false);};
 const expires=weeklyGoalExpiresAt(week,p?.weekly_goal_saved_at?.[week]??Date.now());
 return <Screen title="家长周目标"><p>由家长按周设置，仅在这里查看和修改，不在每日活动中重复展示。每个目标默认保留30天。</p>{p?<>
  <label>选择这一周（任意一天）<input type="date" value={week} onChange={e=>{if(e.target.value){setWeek(localWeek(new Date(e.target.value+'T12:00:00').getTime()));setDraft(null);setSaved(false);}}}/></label>
  <p>本周从 {week}（周一）开始，按设备当地日期。</p>
  <label>本周目标<textarea maxLength={200} rows={4} value={value} placeholder="例如：这周和家人练习打招呼，愿意回应就好" onChange={e=>{setDraft(e.target.value);setSaved(false);}}/></label>
  <p><small>{value.length}/200字</small></p>
  {saved&&<p role="status">本周目标已保存，保留至 {new Date(expires).toLocaleDateString()}。</p>}{a.notice}
  <div className="row"><button className="primary" disabled={!value.trim()||a.busy} onClick={()=>void a.run(()=>useLearningStore.getState().saveWeeklyGoal(week,value),()=>{setDraft(null);setSaved(true);})}>确认周目标</button><button className="secondary" disabled={a.busy} onClick={cancel}>取消</button></div>
  <section className="card" aria-label="最近30天的周目标"><h2>最近30天的周目标</h2>{recent.length?<ul>{recent.map(([goalWeek,text])=><li key={goalWeek}><strong>本周从 {goalWeek} 开始</strong><p>{text}</p><small>保留至 {new Date(weeklyGoalExpiresAt(goalWeek,p.weekly_goal_saved_at?.[goalWeek])).toLocaleDateString()}</small></li>)}</ul>:<p>最近30天还没有已保存的周目标。</p>}</section>
  </>:<p>请先建立本机档案。</p>}</Screen>;
}
export function RecordPreferencesScreen(){
 const s=useAppStore(v=>v.snapshot),a=useAction();const [enabledDraft,setEnabled]=useState<boolean|null>(null),[timeDraft,setTime]=useState<string|null>(null),[saved,setSaved]=useState(false);const enabled=enabledDraft??s?.settings?.daily_record_enabled??true,time=timeDraft??s?.settings?.daily_record_time??'20:00';
 return <Screen title="每日记录设置"><label><input type="checkbox" checked={enabled} onChange={e=>{setEnabled(e.target.checked);setSaved(false);}}/>开启每日记录展示</label><label>晚间展示时间（设备当地时间）<input type="time" value={time} onChange={e=>{setTime(e.target.value);setSaved(false);}}/></label><p>默认每天20:00。到时间后，在今日页展示晚间记录入口；活动结束后进入集中记录。白天活动结束直接保存进度。</p><p>关闭后不再自动展示或跳转；已有记录和草稿保留，需要时仍可从活动记录手动补记。不会发送系统通知。</p>{saved&&<p role="status">每日记录设置已保存。</p>}{a.notice}<button className="primary" disabled={a.busy||!s?.profile} onClick={()=>void a.run(()=>useLearningStore.getState().saveRecordPreferences(enabled,time),()=>setSaved(true))}>保存每日记录设置</button></Screen>;
}
export function DailyRecordsScreen(){
 const s=useAppStore(v=>v.snapshot),now=useClock(),navigate=useNavigate(),rows=pendingRecords(s?.sessions??[],now);
 return <Screen title="晚间表现记录"><p>按活动分别回看，选择独立／帮助后／暂未；没看清也可以如实记录。</p>{rows.map(row=><section className="card" key={row.id}><h2>{row.selection_snapshot.target_label_snapshot}</h2><p>{localDate(row.ended_at??row.started_at)} · {new Date(row.ended_at??row.started_at).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}（设备当地时间）</p><Link className="button-link" to={'/activity/'+row.id+'/record?returnTo=daily'}>记录这次表现</Link></section>)}{!rows.length&&<p role="status">目前没有需要补记的活动。</p>}<div className="row"><button onClick={()=>navigate('/today')}>先到这里，回到今日</button><Link to="/settings/records">每日记录设置</Link></div></Screen>;
}
