import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { useCourseIndex } from './formalCourseData';
import { androidListening, listeningNative, type ListeningPlan } from './listeningNative';
import './listeningSchedules.css';

const weekdays = ['周一','周二','周三','周四','周五','周六','周日'];
const repeatOptions = [
  ['once','仅一次'], ['daily','每天'], ['weekday','周一至周五'], ['weekend','周末'],
  ['workday','法定工作日'], ['holiday','法定节假日'], ['weekly','自定义星期'],
] as const;
type RepeatOption = typeof repeatOptions[number][0];

function repeatLabel(plan: ListeningPlan) {
  if (plan.repeat !== 'weekly') return repeatOptions.find(([key]) => key === plan.repeat)?.[1];
  if (plan.days.length === 7) return '每天';
  if (plan.days.join() === '1,2,3,4,5') return '周一至周五';
  if (plan.days.join() === '6,7') return '周末';
  return plan.days.map(day => weekdays[day-1]).join('、');
}

function newPlan(): ListeningPlan {
  return { id: crypto.randomUUID(), time: '19:30', scenes: [], repeat: 'once', days: [],
    enabled: true, vibrate: false, note: '', onceAt: 0, playCount: 3 };
}

function timePart(value: number) {
  return String(value).padStart(2,'0');
}

const timeRowHeight = 44;

function TimeColumn({label,value,limit,onChange,offset=0}: {label:string;value:number;limit:number;onChange:(value:number)=>void;offset?:number}) {
  const wheel = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; startY: number; startTop: number; moved: boolean } | null>(null);
  const ignoreClick = useRef(false);
  useLayoutEffect(() => {
    if (wheel.current && !drag.current?.moved) wheel.current.scrollTop = value * timeRowHeight;
  },[value]);
  const clamp = (next: number) => Math.max(0,Math.min(limit-1,next));
  const select = (next: number) => {
    const selected = clamp(next);
    if (wheel.current) wheel.current.scrollTop = selected * timeRowHeight;
    onChange(selected);
  };
  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    const gesture = drag.current;
    if (gesture?.id !== event.pointerId) return;
    drag.current = null;
    if (gesture.moved) select(Math.round(event.currentTarget.scrollTop/timeRowHeight));
  };
  useEffect(() => {
    const element = wheel.current;
    if (!element) return;
    const scroll = (event: WheelEvent) => {
      if (!event.deltaY || drag.current) return;
      event.preventDefault();
      const selected = Math.max(0, Math.min(limit-1,
        Math.round(element.scrollTop/timeRowHeight) + Math.sign(event.deltaY)));
      element.scrollTop = selected * timeRowHeight;
      onChange(selected);
    };
    element.addEventListener('wheel',scroll,{passive:false});
    return () => element.removeEventListener('wheel',scroll);
  },[limit,onChange]);
  return <div className="schedule-time-column">
    <span>{label}</span>
    <div ref={wheel} className="schedule-time-wheel" role="spinbutton" tabIndex={0}
      aria-label={label} aria-valuemin={offset} aria-valuemax={limit-1+offset} aria-valuenow={value+offset}
      onPointerDown={event => {
        if (event.button !== 0 || drag.current) return;
        ignoreClick.current = false;
        drag.current = {id:event.pointerId,startY:event.clientY,startTop:event.currentTarget.scrollTop,moved:false};
      }}
      onPointerMove={event => {
        const gesture = drag.current;
        if (gesture?.id !== event.pointerId) return;
        const delta = gesture.startY - event.clientY;
        if (!gesture.moved) {
          if (Math.abs(delta) < 6) return;
          gesture.moved = true;
          ignoreClick.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
        }
        event.currentTarget.scrollTop = gesture.startTop + delta;
        const selected = clamp(Math.round(event.currentTarget.scrollTop/timeRowHeight));
        if (selected !== value) onChange(selected);
      }}
      onPointerUp={finishDrag} onPointerCancel={finishDrag}
      onLostPointerCapture={event => {
        if (event.target === event.currentTarget) finishDrag(event);
      }}
      onPointerLeave={event => { if (event.pointerType === 'mouse' && !drag.current?.moved) finishDrag(event); }}
      onClickCapture={event => {
        if (!ignoreClick.current) return;
        ignoreClick.current = false;
        event.stopPropagation();
      }}
      onKeyDown={event => {
        const keys: Partial<Record<string,number>> = {ArrowUp:value+1,ArrowDown:value-1,Home:0,End:limit-1};
        const next = keys[event.key];
        if (next!==undefined) { event.preventDefault(); select(next); }
      }}>
      {Array.from({length:limit},(_,i) => <button className={i===value ? 'selected' : undefined}
        key={i} type="button" tabIndex={-1} aria-hidden="true" onClick={() => select(i)}>{offset ? i+offset : timePart(i)}</button>)}
    </div>
  </div>;
}

const executionLabels = {triggered:'已触发，正在准备播放',played:'已开始播放',missed:'未在有效时间内触发',failed:'播放启动失败'};

export default function ListeningSchedules() {
  const { index } = useCourseIndex();
  const [plans,setPlans] = useState<ListeningPlan[]>([]);
  const [exact,setExact] = useState(false);
  const [registeredAt,setRegisteredAt] = useState(0);
  const [loaded,setLoaded] = useState(false);
  const [draft,setDraft] = useState<ListeningPlan>();
  const [editingExisting,setEditingExisting] = useState(false);
  const [panel,setPanel] = useState<'editor'|'repeat'|'scenes'|'count'>('editor');
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [calendar,setCalendar] = useState<{ granted: boolean; names: string[] }>();
  const supported = new Set(index?.listening_programs?.filter(program =>
    program.kind === 'immersion' && program.lines.length && program.lines.every(line => line.audio_asset?.startsWith('audio/')),
  ).map(program => program.scene_id));
  const scenes = index?.scenes.filter(scene => !scene.segmented && supported.has(scene.scene_id)) ?? [];
  const title = (plan: ListeningPlan) => plan.note || scenes.find(scene => scene.scene_id === plan.scenes[0])?.title || '熏听';
  const report = (reason: unknown) => {
    const message = reason && typeof reason === 'object' && 'message' in reason
      ? String(reason.message) : String(reason);
    setError(message);
    window.scrollTo({top:0,behavior:'auto'});
  };

  useEffect(() => {
    if (!androidListening) return;
    let current = true;
    const refresh = () => {
      if (document.hidden) return;
      void listeningNative.list().then(value => {
        if (current) { setPlans(value.plans); setExact(value.exact); setRegisteredAt(value.registeredAt); setLoaded(true); }
      }).catch(reason => { if (current) report(reason); });
    };
    refresh();
    document.addEventListener('visibilitychange',refresh);
    window.addEventListener('focus',refresh);
    return () => {
      current = false;
      document.removeEventListener('visibilitychange',refresh);
      window.removeEventListener('focus',refresh);
    };
  },[]);

  const save = async (plan: ListeningPlan, leaveEditor: boolean) => {
    setBusy(true); setError('');
    try {
      const next = { ...plan, note: plan.note.trim() };
      if (next.repeat === 'once' && next.enabled && (leaveEditor || next.onceAt <= Date.now())) {
        const date = new Date();
        const [h = 0,m = 0] = next.time.split(':').map(Number);
        date.setHours(h,m,0,0);
        if (date.getTime() <= Date.now()) date.setDate(date.getDate()+1);
        next.onceAt = date.getTime();
      }
      const value = await listeningNative.save({plan:next});
      setPlans(value.plans); setExact(value.exact); setRegisteredAt(value.registeredAt);
      if (leaveEditor) setDraft(undefined);
    } catch (reason) { report(reason); }
    finally { setBusy(false); }
  };
  const update = (patch: Partial<ListeningPlan>) => setDraft(previous => previous && {...previous,...patch});
  const setRepeat = async (option: RepeatOption) => {
    if (option === 'workday' || option === 'holiday') {
      try {
        const state = await listeningNative.calendar({request:false});
        setCalendar(state);
        if (!state.granted) { report('请授权手机日历~'); return; }
      } catch (reason) { report(reason); return; }
    }
    setError('');
    const days = option === 'daily' ? [1,2,3,4,5,6,7] : option === 'weekday' ? [1,2,3,4,5] :
      option === 'weekend' ? [6,7] : draft?.days.length ? draft.days : [1];
    update({ repeat: option === 'once' || option === 'workday' || option === 'holiday' ? option : 'weekly', days });
  };
  const toggleScenes = (ids: string[], checked: boolean) => {
    const picked = new Set(draft?.scenes ?? []);
    ids.forEach(id => checked ? picked.add(id) : picked.delete(id));
    update({ scenes: scenes.map(scene=>scene.scene_id).filter(id=>picked.has(id)) });
  };
  const edit = (plan?: ListeningPlan) => {
    setDraft(plan ?? newPlan()); setEditingExisting(Boolean(plan)); setPanel('editor'); setError('');
  };
  const back = () => {
    setError('');
    if (panel !== 'editor') setPanel('editor');
    else setDraft(undefined);
  };
  const next = plans.filter(plan => plan.enabled && plan.nextAt).sort((a,b)=>(a.nextAt ?? 0)-(b.nextAt ?? 0))[0];
  const [hour = 0,minute = 0] = (draft?.time ?? '00:00').split(':').map(Number);
  const upcoming = registeredAt ? new Date(registeredAt) : undefined;
  const upcomingLabel = upcoming && (upcoming.toDateString() === new Date().toDateString() ?
    `今天 ${timePart(upcoming.getHours())}:${timePart(upcoming.getMinutes())}` : upcoming.toLocaleString());
  return <section className="listening-schedules">
    <div className={`schedule-header${draft ? ' schedule-header-centered' : ''}${panel === 'scenes' ? ' schedule-header-sticky' : ''}`}>
      {draft ? <button className="schedule-back" onClick={back} disabled={busy}>{panel !== 'editor' ? '‹ 返回' : '取消'}</button> : <Link className="schedule-back" aria-label="返回听一听" to="/listen">‹</Link>}
      <h1 tabIndex={-1}>{!draft ? '定时熏听' : panel === 'repeat' ? '重复' : panel === 'scenes' ? '选择场景' : panel === 'count' ? '播放次数' : editingExisting ? '编辑定时熏听' : '添加定时熏听'}</h1>
      {androidListening && !draft && <button aria-label="添加" className="primary" onClick={() => edit()}>＋ 添加</button>}
      {draft && panel === 'editor' && <button className="primary" disabled={busy || !draft.time || !draft.scenes.length || (draft.repeat === 'weekly' && !draft.days.length)} onClick={() => void save(draft,true)}>保存</button>}
      {draft && panel !== 'editor' && <button className="primary" onClick={() => setPanel('editor')}>{panel === 'repeat' ? '保存' : '确定'}</button>}
    </div>
    {error && <p className="schedule-error" role="alert">{error}</p>}
    {!androidListening && <p role="status">请在 Android 应用中设置定时熏听。</p>}
    {androidListening && !draft && <>
      {loaded && !exact && <div className="notice" role="status"><p>任务已开启后仍需允许「闹钟和提醒」，才能到点播放。</p><button onClick={() => void listeningNative.alarmPermission().catch(report)}>开启权限</button></div>}
      {exact && upcoming && <div className="schedule-next"><span>下次熏听</span><strong>{upcomingLabel}</strong></div>}
      {exact && next && !upcoming && <p role="alert">系统尚未登记下次播放，请检查「闹钟和提醒」权限。</p>}
      {!plans.length && <p>暂无定时熏听。</p>}
      {plans.map(plan => <article className="card schedule-item" key={plan.id}>
        <button className="schedule-open" onClick={() => edit(plan)}><strong>{plan.time}</strong><span>{title(plan)}</span><small>{repeatLabel(plan)} · {plan.scenes.length} 个场景{plan.enabled && !plan.nextAt ? ' · 暂无可用日期' : ''}</small>
          {plan.lastStatus && <small>上次 · {executionLabels[plan.lastStatus]}</small>}
        </button>
        <label className="schedule-switch"><input type="checkbox" role="switch" aria-label={title(plan)} checked={plan.enabled} disabled={busy} onChange={event => void save({...plan,enabled:event.currentTarget.checked},false)}/></label>
      </article>)}
    </>}
    {draft && panel === 'editor' && <div className="schedule-fields">
      <div className="schedule-time" role="group" aria-label="时间">
        <TimeColumn label="时" value={hour} limit={24} onChange={value => setDraft(previous =>
          previous && {...previous,time:`${timePart(value)}:${previous.time.slice(3)}`})}/>
        <TimeColumn label="分" value={minute} limit={60} onChange={value => setDraft(previous =>
          previous && {...previous,time:`${previous.time.slice(0,2)}:${timePart(value)}`})}/>
      </div>
      <button className="schedule-field" onClick={() => setPanel('scenes')}>场景 <span>{draft.scenes.length ? `已选 ${draft.scenes.length} 个场景` : '请选择'} ›</span></button>
      <button className="schedule-field" onClick={() => setPanel('count')}>播放次数 <span>{draft.playCount ?? 1} 次 ›</span></button>
      <button className="schedule-field" onClick={() => setPanel('repeat')}>重复 <span>{repeatLabel(draft)} ›</span></button>
      <label className="schedule-field">震动<input role="switch" type="checkbox" checked={draft.vibrate} onChange={event => update({vibrate:event.currentTarget.checked})}/></label>
      <label className="schedule-field">备注<input value={draft.note} maxLength={40} placeholder="默认使用首个场景名称" onChange={event => update({note:event.currentTarget.value})}/></label>
      <p className="product-muted">所选场景按顺序播放 {draft.playCount ?? 1} 次后结束。</p>
      {editingExisting && !!draft.nextAt && <button disabled={busy} onClick={() => void listeningNative.addToCalendar({at:draft.nextAt!,title:title(draft)}).catch(report)}>将已保存的下次熏听添加到手机日历</button>}
      {editingExisting && <button disabled={busy} onClick={async () => {
        if (!window.confirm('删除这条定时熏听？')) return;
        setBusy(true);
        try { const value = await listeningNative.remove({id:draft.id}); setPlans(value.plans); setDraft(undefined); }
        catch (reason) { report(reason); }
        finally { setBusy(false); }
      }}>删除</button>}
    </div>}
    {draft && panel === 'count' && <div className="schedule-count">
      <TimeColumn label="播放次数" value={(draft.playCount ?? 1)-1} limit={10} offset={1} onChange={value => update({playCount:value+1})}/>
    </div>}
    {draft && panel === 'repeat' && <>
      <div className="schedule-repeat">{repeatOptions.filter(([id])=>id!=='weekly').map(([id,label]) => <label key={id}>
        <input name="repeat" type="radio" checked={repeatLabel(draft) === label} onChange={() => void setRepeat(id)}/><span>{label}</span>
      </label>)}</div>
      <button className="schedule-field schedule-calendar" onClick={() => void listeningNative.calendar({request:true}).then(state => { setCalendar(state); if (state.granted) setError(''); else report('请授权手机日历~'); }).catch(report)}>手机日历 <span>{calendar?.granted ? '已授权' : '授权读取'} ›</span></button>
      {calendar?.granted && <p>{calendar.names.length ? `可用日历：${calendar.names.join('、')}` : '手机没有可见日历。'}</p>}
      {calendar && !calendar.granted && <p>手机日历读取权限未开启。</p>}
      <h2 className="schedule-weekdays-title">自定义星期</h2>
      <div className="schedule-days" aria-label="按星期重复">{weekdays.map((day,i) => <button key={day} aria-pressed={draft.repeat === 'weekly' && draft.days.includes(i+1)} onClick={() => {
        const days = new Set(draft.repeat === 'weekly' ? draft.days : []);
        if (days.has(i+1)) days.delete(i+1); else days.add(i+1);
        update({repeat:'weekly',days:[...days].sort()});
      }}>{day}</button>)}</div>
      <p className="product-muted">法定日期按中国大陆 2026–2027 年放假调休安排执行。</p>
    </>}
    {draft && panel === 'scenes' && <>
      {Object.entries(index?.groups ?? {}).map(([group,label]) => {
        const groupScenes = scenes.filter(scene => scene.category === group);
        if (!groupScenes.length) return null;
        const ids = groupScenes.map(scene=>scene.scene_id);
        const count = ids.filter(id=>draft.scenes.includes(id)).length;
        return <fieldset key={group}><legend>{label}</legend>
          <label className="listen-text-option">全部小场景<input type="checkbox" checked={count===ids.length} ref={element=>{if(element)element.indeterminate=count>0&&count<ids.length;}} onChange={event=>toggleScenes(ids,event.currentTarget.checked)}/></label>
          {groupScenes.map(scene => <label className="listen-text-option" key={scene.scene_id}>{scene.title}<input type="checkbox" checked={draft.scenes.includes(scene.scene_id)} onChange={event=>toggleScenes([scene.scene_id],event.currentTarget.checked)}/></label>)}
        </fieldset>;
      })}
      <p role="status">已选 {draft.scenes.length} 个场景</p>
    </>}
  </section>;
}
