import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { useLearningStore } from '../stores/learningStore';
import { readCatalog } from '../content/catalog';
import { ok, type CourseId, type Theme, type ObservationResult } from '../content/types';
import { findCourseUnit } from '../domain/courseCatalog';
import { findContext } from '../content/contexts';
import { DAY_MS, chinaDay, weekStart } from '../domain/time';
import { landing } from '../services/bootstrap';
import { cancelSpeech } from '../services/tts';
import { cancelAudio } from '../services/audio';
import { exportRecords, eraseLocalData } from '../services/exportService';
import { Screen, useAction } from './shared';
import { ResultForm } from './ResultForm';
import { EmptyState } from '../components/EmptyState';
import { StatusNotice } from '../components/StatusNotice';
import { MigrationFailurePanel } from '../components/MigrationFailurePanel';
import { ThemeCard } from '../components/ThemeCard';
import { GoalSummary } from '../components/GoalSummary';
import { PresentationModeSwitch } from '../components/PresentationModeSwitch';
import { ContextMaterialPreview } from '../components/ContextMaterialPreview';
import { ParentDisclosure } from '../components/ParentDisclosure';
import { ContextSwitch } from '../components/ContextSwitch';
import { ActivityStepProgress } from '../components/ActivityStepProgress';
import { PauseSheet } from '../components/PauseSheet';
import { NextStepCard } from '../components/NextStepCard';
import { EvidenceList } from '../components/EvidenceList';
import { OutcomeCountList } from '../components/OutcomeCountList';
import { WeekSelector } from '../components/WeekSelector';
import { ReportFreshnessBadge } from '../components/ReportFreshnessBadge';
import { ParentActionGate } from '../components/ParentActionGate';
import { sceneForContext } from '../content/contextScenes';
import { resolveLesson } from '../domain/lesson';
import { taskPicture } from '../content/topicArtwork';
import { ImageTopicCard } from '../components/ImageTopicCard';
import { AudioPhrase } from '../components/AudioPhrase';
import { PlanEvaluationPanel } from '../components/PlanEvaluationPanel';
import { eveningReady } from '../domain/parentPlan';
import { SceneAutoplaySetting } from '../components/SceneAutoplaySetting';
import { EveningRecords } from './parent-screens';
const actions=()=>useLearningStore.getState();
function useTheme(){
 const [query]=useSearchParams(),params=useParams(),s=useAppStore(v=>v.snapshot);
 const catalog=readCatalog();const id=params.themeId ?? query.get('theme') ?? s?.profile?.selection?.theme_id;
 return catalog.ok?catalog.data.find(t=>t.id===id) ?? null:null;
}
function useTask(theme:Theme|null){
 const [query]=useSearchParams();
 const id=query.get('task');
 return id?theme?.tasks.find(t=>t.id===id)??null:theme?.tasks[0]??null;
}
function lessonQuery(themeId:string,taskId:string){return '?theme='+encodeURIComponent(themeId)+'&task='+encodeURIComponent(taskId);}
function useCanSave(){return useAppStore(v=>!!v.snapshot?.profile&&!!v.snapshot?.consent?.granted_at&&!v.snapshot.consent.revoked_at);}
function StartSaving({returnTo}:{returnTo:string}){return <section className="notice"><p>当前只浏览示例。建立本机演示档案后，就能保存并继续这个活动。</p><Link className="button-link primary" to={'/welcome?returnTo='+encodeURIComponent(returnTo)}>建立档案并继续</Link></section>;}
function endedResult(kind:'stopped'|'refused'):ObservationResult{return {participation:kind,outcome:null,unknown_reason:kind,prompt_types:null,opportunity_observed:null,note:null};}
export function BootScreen(){
 const status=useAppStore(v=>v.status),errorCode=useAppStore(v=>v.errorCode),snapshot=useAppStore(v=>v.snapshot);
 // 启动闸门：读取完成前不落任何业务页；升级失败给专用提示，
 // 其余读取失败也不静默当成空数据。
 if(status==='error') return <Screen title="正在准备">{errorCode==='MIGRATION_FAILED'?<MigrationFailurePanel/>:<><StatusNotice error message="本机数据读取失败，请重试；不会用空记录替代读取失败。"/><button onClick={()=>void useAppStore.getState().boot()}>重新读取</button></>}</Screen>;
 if(status==='ready'&&snapshot) return <Navigate to={landing(snapshot)} replace/>;
 return <Screen title="正在准备"><p>读取本机数据中…</p></Screen>;
}
export function WelcomeScreen(){
 const a=useAction(),navigate=useNavigate(),[query]=useSearchParams();
 const next=query.get('returnTo');const safe=next?.startsWith('/goals/select?')||next?.startsWith('/observations/new?')?next:'/today';
 return <Screen title="每天一起，轻松说一点"><p>这是仅使用假数据的本机演示。家长带孩子玩，每次只做一个小活动。</p>
 <ul><li>不用录音，也不需要真实姓名。</li><li>记录仅保存在这台设备，清除浏览器数据可能丢失。</li><li>一起说、先等再帮、换个场景是帮助方式，不是官方等级。</li></ul>
 {a.notice}<button className="primary" disabled={a.busy} onClick={()=>void a.run(()=>actions().grant(),()=>navigate('/setup?returnTo='+encodeURIComponent(safe)))}>我是监护人，同意本机演示数据说明</button><p><Link to="/entry">选择进入方式</Link> · <Link to="/themes">先看示例</Link> · <Link to="/settings/help">了解怎样使用</Link></p></Screen>;
}

export function SetupScreen(){
 const a=useAction(),navigate=useNavigate(),[query]=useSearchParams();
 const next=query.get('returnTo');const safe=next?.startsWith('/goals/select?')||next?.startsWith('/observations/new?')?next:'/today';
 return <Screen title="建立演示档案"><p>建立“演示孩子”档案，试一试如何保存学习记录，不需要真实儿童信息。</p>{a.notice}
 <button className="primary" disabled={a.busy} onClick={()=>void a.run(()=>actions().setup(),()=>navigate(safe))}>创建本机演示档案</button></Screen>;
}

export function TodayScreen(){
 const [query]=useSearchParams();
 const s=useAppStore(v=>v.snapshot),active=s?.sessions.find(r=>r.deleted_at===null&&['active','paused'].includes(r.status));
 const lesson=resolveLesson(active?.selection_snapshot??s?.profile?.selection??null);
 const yesterday=useState(()=>chinaDay(Date.now()-DAY_MS))[0];
 const pending=active&&['awaiting_record','pending_record'].includes(active.status);
 return <Screen title="今天，一起做一件小事"><p className="eyebrow">每天一点 · 家长陪伴</p><>{query.has('finished')&&<p role="status" className="notice">本次活动已结束，进度已保存。{s?.settings?.daily_record_enabled===false?'每日记录已关闭，需要时可到活动记录手动补记。':`表现记录在设备当地时间 ${s?.settings?.daily_record_time??'20:00'} 集中展示。`}</p>}</><EveningRecords/><section className="card hero-card"><h2>{lesson.ok?lesson.data.task.title_zh:'先和玩偶打个招呼'}</h2>
 <p>{!lesson.ok&&'试一个入门小活动，可以随时更换。'}</p>
 {lesson.ok&&<><p>{lesson.data.task.minutes.min}—{lesson.data.task.minutes.max}分钟 · {lesson.data.unit.course_id==='dialogue'?'对话课':'词卡课'}</p><p>准备：{lesson.data.context.materials_zh.join('、')}</p><p>支持方式：可以示范、等一等，再按需帮助。</p></>}
 {active?<Link className="button-link primary" to={'/activity/'+active.id+(pending?'/record':'')}>{pending?'补记这次活动':`继续上次活动 · 第${active.current_step_index+1}/4步`}</Link>:<Link className="button-link primary" to={lesson.ok?'/activity/prepare':'/goals/select?theme=family-greetings'}>{lesson.ok?'开始今天的活动':'试试玩偶问候'}</Link>}
 <p><Link to="/themes">换一个活动</Link></p></section><div className="row"><Link to={'/results/'+yesterday}>查看昨日</Link><Link to="/records">活动记录与待补记</Link><Link to="/reports">本周回看</Link><Link to="/settings/weekly-goal">家长周目标</Link></div><p>孩子不想玩时随时结束，不必学满时间。</p></Screen>;
}

export function ThemesScreen(){
 const catalog=readCatalog(),navigate=useNavigate();
 return <Screen title="选一个喜欢的主题">{catalog.ok?<div className="catalog-grid">{catalog.data.map(theme=><ThemeCard key={theme.id} theme={theme} onSelect={()=>navigate('/themes/'+theme.id)}/>)}</div>:<StatusNotice error message={catalog.error.message}/>}</Screen>;
}

export function ThemeDetailScreen(){
 const theme=useTheme(),navigate=useNavigate();
 return <Screen title={theme?.title_zh??'主题不可用'}>{theme?<div className="catalog-grid topic-grid">{theme.tasks.map(task=><ImageTopicCard key={task.id} title={task.title_zh} image={taskPicture(theme.id,task.id)} count={1} onSelect={()=>navigate('/goals/select'+lessonQuery(theme.id,task.id))}/>)}</div>:<Link to="/themes">返回主题列表</Link>}</Screen>;
}

export function ObservationScreen(){
 const theme=useTheme(),task=useTask(theme),a=useAction(),navigate=useNavigate(),canSave=useCanSave();
 const stimulus=task?.steps.find(step=>step.phase==='observe');
 const route=theme&&task?'/observations/new'+lessonQuery(theme.id,task.id):'/themes';
 return <Screen title="先看看孩子怎样回应">{theme&&task?<><p>准备：{task.materials_zh.join('、')}</p><p>先按下面的问题试一次。需要帮助就示范，不强迫开口。</p>{stimulus&&<section className="notice"><p>{stimulus.instruction_zh}</p><p className="english"><AudioPhrase text={stimulus.line_en} path={stimulus.audio.path}/></p></section>}{canSave?<>{a.notice}<ResultForm key={task.id} observation={task.observation} busy={a.busy} onSubmit={result=>void a.run(()=>actions().saveObservation(theme,result,task.id),()=>navigate('/goals/select'+lessonQuery(theme.id,task.id)+'&observed=1'))}/></>:<StartSaving returnTo={route}/>}<p><Link to={'/goals/select'+lessonQuery(theme.id,task.id)}>不先观察，直接试一节</Link></p></>:<Link to="/themes">先选择活动</Link>}</Screen>;
}

export function GoalSelectionScreen(){
 const theme=useTheme(),task=useTask(theme),[query]=useSearchParams(),canSave=useCanSave();

 const [course,setCourse]=useState<CourseId|null>(null),[contextId,setContextId]=useState<string|null>(null),a=useAction(),navigate=useNavigate();
 const unit=theme&&task&&course?findCourseUnit(theme.id,task.id,course):null;
 const unitOk=unit?.ok?unit.data:null;
 const ctxId=contextId&&unitOk?.context_ids.includes(contextId)?contextId:unitOk?.default_context_id??null;
 const chosen=ctxId?findContext(ctxId):null;
 const ref=unitOk&&chosen?.ok?{course_id:unitOk.course_id,unit_id:unitOk.unit_id,observation_condition_key:chosen.data.observation_condition_key}:null;
 return <Screen title="选择这次玩法">{theme&&task?<><h2>{task.title_zh}</h2><p><Link to={'/observations/new'+lessonQuery(theme.id,task.id)}>先观察一次</Link> · <Link to={'/lessons/'+theme.id+'?task='+task.id}>先看怎么带</Link></p>{query.get('observed')&&<p className="notice">刚才的观察已保存。可以继续选择玩法。</p>}
 {!canSave?<StartSaving returnTo={'/goals/select'+lessonQuery(theme.id,task.id)}/>:<><PresentationModeSwitch themeId={theme.id} taskId={task.id} currentCourse={course} busy={a.busy} onSwitchCourse={u=>{setCourse(u.course_id);setContextId(null);}}/>
 {unitOk&&<><ContextSwitch unit={unitOk} value={ctxId??unitOk.default_context_id} onChange={setContextId} onConfirmTransfer={setContextId}/><ParentDisclosure title="看看这次怎么带"><ContextMaterialPreview unit={unitOk} contextId={ctxId??unitOk.default_context_id}/></ParentDisclosure></>}
 <ParentDisclosure title="支持方式（供家长参考）"><ul className="support-method-list">{task.path.map(p=><li key={p.level}>{p.title_zh}：{p.support_zh}</li>)}</ul></ParentDisclosure><p>学习目标由家长按周设置。<Link to="/settings/weekly-goal">设置／查看周目标</Link></p>{a.notice}<button className="primary" disabled={!ref||a.busy} onClick={()=>{if(ref)void a.run(()=>actions().confirmSelection(theme,0,ref,task.id),()=>navigate('/activity/prepare'));}}>确认玩法</button><p><small>选择玩法后进入准备。支持方式仅作文字参考，无需选择。</small></p></>}
 </>:<Link to="/themes">没有找到这个活动，重新选择</Link>}</Screen>;
}

export function PrepareScreen(){
 const s=useAppStore(v=>v.snapshot),a=useAction(),navigate=useNavigate();
 const lesson=resolveLesson(s?.profile?.selection??null);
 const active=s?.sessions.find(r=>r.deleted_at===null&&['active','paused'].includes(r.status));
 return <Screen title="准备好，轻松开始">{lesson.ok?<><h2>{lesson.data.task.title_zh}</h2><section className="card"><h2>准备这些就好</h2><ul>{lesson.data.context.materials_zh.map(m=><li key={m}>{m}</li>)}</ul><p>{lesson.data.context.roles_zh}</p><p>约{lesson.data.task.minutes.min}—{lesson.data.task.minutes.max}分钟，随时可以结束。</p><AudioPhrase text={lesson.data.steps[0]?.line_en??'Hello!'} path={lesson.data.steps[0]?.audio} label="试听开场"/></section>
 {active&&<section className="notice"><p>还有一次进行中的活动，可以先继续或结束。</p><Link to={'/activity/'+active.id+(['awaiting_record','pending_record'].includes(active.status)?'/record':'')}>处理上次活动</Link></section>}{a.notice}
 <button className="primary" disabled={a.busy} onClick={()=>void a.run(()=>actions().startActivity(),data=>{const row=data.sessions.find(x=>x.deleted_at===null&&['active','paused'].includes(x.status));if(row)navigate('/activity/'+row.id+(['awaiting_record','pending_record'].includes(row.status)?'/record':''));})}>开始／继续活动</button></>:<><p>{lesson.error.message}</p><Link to="/themes">选择活动</Link></>}</Screen>;
}

export function ActivityScreen(){
 const {sessionId}=useParams(),s=useAppStore(v=>v.snapshot),a=useAction(),navigate=useNavigate();
 useEffect(()=>()=>{cancelSpeech();cancelAudio();},[]);
 const session=s?.sessions.find(r=>r.id===sessionId&&r.deleted_at===null);
 const lesson=resolveLesson(session?.selection_snapshot??null);
 const step=lesson.ok?lesson.data.steps[session?.current_step_index??-1]:null;
 const selectedScene=lesson.ok?sceneForContext(lesson.data.context.context_id):null;
 const end=(kind:'completed'|'stopped'|'refused')=>{if(session){cancelSpeech();cancelAudio();void a.run(()=>actions().endActivity(session.id,kind),()=>navigate(eveningReady(s?.settings,Date.now())?'/daily-records':'/today?finished=1'));}};
 return <Screen title={lesson.ok?lesson.data.task.title_zh:'活动不可用'}>{session&&step&&lesson.ok?<><ActivityStepProgress index={session.current_step_index} total={lesson.data.steps.length}/><p className="eyebrow">{lesson.data.unit.course_id==='dialogue'?'对话课':'词卡课'} · {lesson.data.context.title_zh}</p><h2>{step.title_zh}</h2>
 {selectedScene&&<img className="scene-preview" src={step.phase==='observe'?selectedScene.image_path.replace('scenes/','scenes/observation/'):selectedScene.image_path} alt={step.phase==='observe'?'本次观察使用的场景图':selectedScene.alt_zh}/>}
 <p className="english"><AudioPhrase key={session.current_step_index} text={step.line_en} path={step.audio}/></p><section className="notice"><h3>家长这样带</h3><p>{step.instruction_zh}</p><p>准备：{lesson.data.context.materials_zh.join('、')}</p></section>
 {step.expected_response_en&&<details className="lesson-hint" key={session.current_step_index}><summary>{step.phase==='observe'?'需要帮助时看提示':'看看回应示例'}</summary><p>如果说出示例后孩子跟说，请记录为提示后完成。</p><p className="english" lang="en-US">{step.expected_response_en}</p></details>}
 {a.notice}<PauseSheet open={session.status==='paused'} onResume={()=>void a.run(()=>actions().saveCheckpoint(session.id,session.current_step_index))} onEnd={()=>end('stopped')}/>
 {session.status==='active'&&<div className="stack"><button className="primary" disabled={a.busy} onClick={()=>{cancelAudio();cancelSpeech();if(session.current_step_index<3)void a.run(()=>actions().saveCheckpoint(session.id,session.current_step_index+1));else end('completed');}}>{session.current_step_index<3?'这一段完成，继续':'结束本次活动'}</button>{session.current_step_index>0&&<button disabled={a.busy} onClick={()=>{cancelAudio();cancelSpeech();void a.run(()=>actions().saveCheckpoint(session.id,session.current_step_index-1));}}>回看上一步</button>}<button disabled={a.busy} onClick={()=>{cancelSpeech();cancelAudio();void a.run(()=>actions().pauseActivity(session.id));}}>暂停</button></div>}
 {['awaiting_record','pending_record'].includes(session.status)&&<Link to={'/activity/'+session.id+'/record'}>补记表现</Link>}{session.status==='recorded'&&<Link to="/today">已记录，回到今日</Link>}<p><Link to="/today">回到今日（进度已保存）</Link></p></>:<><EmptyState message="活动内容暂不可用，请重新选择。"/><Link to="/today">回到今日</Link></>}</Screen>;
}

export function RecordScreen(){
 const [query]=useSearchParams();
 const {sessionId}=useParams(),s=useAppStore(v=>v.snapshot),session=s?.sessions.find(r=>r.id===sessionId),a=useAction(),navigate=useNavigate();
 const lesson=resolveLesson(session?.selection_snapshot??null);
 const initial=session?.record_draft??(session?.completion_kind==='stopped'||session?.completion_kind==='refused'?endedResult(session.completion_kind):null);
 return <Screen title="如实记录，不给孩子打分">{session&&['awaiting_record','pending_record'].includes(session.status)?<>{initial?.participation==='stopped'||initial?.participation==='refused'?<p className="notice">已带入这次提前结束的状态。可以补充备注后直接保存。</p>:null}{a.notice}<ResultForm key={session.id} observation={lesson.ok?lesson.data.task.observation:undefined} initial={initial} busy={a.busy} onDraft={result=>void a.run(()=>actions().saveDraft(session.id,result),()=>navigate('/today'))} onSubmit={(result,context)=>void a.run(()=>actions().submitRecord(session.id,result,context),data=>{const record=data.records.find(r=>r.session_id===session.id);if(record)navigate(query.get('returnTo')==='daily'?'/daily-records':'/next-step/'+record.id);})}/></>:<><EmptyState message="没有待记录的活动，或该活动已提交。"/><Link to="/records">查看活动记录</Link></>}</Screen>;
}

export function NextStepScreen(){
 const {recordId}=useParams(),s=useAppStore(v=>v.snapshot),a=useAction();
 const record=s?.records.find(r=>r.id===recordId&&r.deleted_at===null)??null;
 const suggestion=s?.suggestions.filter(r=>r.trigger_record_id===recordId).sort((x,y)=>y.created_at-x.created_at)[0];
 return <Screen title="这次活动已保存">{record?<><section className="card hero-card"><h2>{record.selection_snapshot.target_label_snapshot}</h2><p>{record.result.participation==='refused'?'这次不想参与。':record.result.participation==='stopped'?'这次提前结束。':record.outcome==='independent'?'这次自己完成了回应。':record.outcome==='prompted'?'这次在帮助后完成了回应。':record.outcome==='not_yet'?'这次愿意参与，还需要一些时间。':'这次没看清，已如实记为未知。'}</p><Link className="button-link primary" to="/today">完成，回到今日</Link></section>
 <details><summary>下次可以怎样帮</summary>{a.notice}{suggestion?<><NextStepCard value={suggestion} onAccept={()=>void a.run(()=>actions().acceptNextStep(suggestion.id))} onDismiss={()=>void a.run(()=>actions().dismissNextStep(suggestion.id))}/><EvidenceList records={s?.records.filter(r=>suggestion.suggestion.evidence_ids.includes(r.id)&&r.deleted_at===null)??[]}/></>:<p>可以先按现在的方式再试一次；证据不足时不判断进阶。</p>}<button disabled={a.busy} onClick={()=>void a.run(()=>actions().loadNextStep(record.id))}>查看观察建议</button></details>
 <details><summary>可选：这次安排怎么样？</summary><p>这里只保存家长对安排的感受，作为参考；观察建议需在上方单独确认。</p><PlanEvaluationPanel key={record.session_id} sessionId={record.session_id} recordId={record.id} level={record.level}/></details><p><Link to={'/results/'+chinaDay(record.occurred_at)}>查看当天记录</Link> · <Link to="/reports">看看本周</Link></p></>:<Link to="/records">没有找到记录，返回活动列表</Link>}</Screen>;
}

export function RecordsScreen(){
 const s=useAppStore(v=>v.snapshot),[filter,setFilter]=useState('all');
 const pending=s?.sessions.filter(x=>x.deleted_at===null&&['awaiting_record','pending_record'].includes(x.status))??[];
 const rows=s?.records.filter(x=>x.deleted_at===null).sort((a,b)=>b.occurred_at-a.occurred_at)??[];
 return <Screen title="活动记录与待补记">{!s?<StatusNotice error message="记录读取失败，请重试。"/>:<><label>筛选记录<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">全部活动</option><option value="pending">只看待补记</option>{readCatalog().ok&&['family-greetings','colors-shapes','kindergarten','animals-actions'].map(id=><option key={id} value={id}>{({ 'family-greetings':'家庭问候','colors-shapes':'认识颜色',kindergarten:'幼儿园','animals-actions':'认识动物'})[id as 'family-greetings'|'colors-shapes'|'kindergarten'|'animals-actions']??id}</option>)}</select></label>
 {(filter==='all'||filter==='pending')&&pending.map(x=><section className="card" key={x.id}><h2>{x.selection_snapshot.target_label_snapshot}</h2><p>待补记 · {chinaDay(x.started_at)}</p><Link className="button-link" to={'/activity/'+x.id+'/record'}>补记这次活动</Link></section>)}
 {filter!=='pending'&&rows.filter(x=>filter==='all'||x.theme_id===filter).map(x=><section className="card" key={x.id}><h2>{x.selection_snapshot.target_label_snapshot}</h2><p>{new Date(x.occurred_at).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})}（北京时间）</p><p>{x.result.participation==='stopped'?'提前结束':x.result.participation==='refused'?'不想参与':x.outcome==='independent'?'自己完成':x.outcome==='prompted'?'帮助后完成':x.outcome==='not_yet'?'暂未回应':'没看清'}</p>{x.result.note&&<p>{x.result.note}</p>}<Link to={'/records/'+x.id}>查看与更正</Link></section>)}
 {!pending.length&&!rows.length&&<p>还没有活动记录。<Link to="/themes">试第一个小活动</Link></p>}</>}</Screen>;
}

export function RecordDetailScreen(){
 const {recordId}=useParams(),record=useAppStore(v=>v.snapshot?.records.find(r=>r.id===recordId)),a=useAction(),[edit,setEdit]=useState(false);
 const lesson=resolveLesson(record?.selection_snapshot??null);
 return <Screen title="记录详情与纠正">{record?<>{a.notice}{record.deleted_at!==null?<p>这条记录已移除，不参与建议和周报。</p>:<><GoalSummary selection={record.selection_snapshot}/><p>{record.result.note??'没有填写备注。'}</p><button onClick={()=>setEdit(!edit)}>{edit?'取消修改':'修改这次记录'}</button>{edit&&<ResultForm key={record.id+':'+record.revision} observation={lesson.ok?lesson.data.task.observation:undefined} initial={record.result} initialContext={record.context_id} busy={a.busy} onSubmit={result=>void a.run(()=>actions().correctRecord(record.id,result),()=>setEdit(false))}/>}<details><summary>移除这条记录</summary><p>移除后不再参与统计，目前不提供恢复。</p><ParentActionGate><button disabled={a.busy} onClick={()=>void a.run(()=>actions().deleteRecord(record.id))}>确认从记录和统计中移除</button></ParentActionGate></details></>}</>:<EmptyState message="没有找到这条记录。"/>}<Link to="/records">返回记录列表</Link></Screen>;
}

export function ReportsScreen(){
 const [week,setWeek]=useState(()=>weekStart(Date.now())),s=useAppStore(v=>v.snapshot),a=useAction();
 const report=s?.reports.find(r=>r.summary.week_start===week);
 return <Screen title="本周观察，小步回看"><WeekSelector value={week} onChange={setWeek}/>{a.notice}<button disabled={a.busy} onClick={()=>void a.run(()=>actions().refreshWeek(week))}>生成／刷新这一周</button>
 <ReportFreshnessBadge stale={!report || report.source_evidence_revision!==s?.meta?.evidence_revision}/><OutcomeCountList result={report?ok(report.summary):null}/><Link to="/reports/history">历史周报</Link></Screen>;
}
export function ReportsHistoryScreen(){
 const reports=useAppStore(v=>v.snapshot?.reports);
 return <Screen title="历史周报">{reports?.length?<ul>{reports.map(r=><li key={r.id}><Link to={'/reports/'+r.summary.week_start}>{r.summary.week_start} 起的一周</Link></li>)}</ul>:<EmptyState message="还没有生成过周报。"/>}</Screen>;
}
export function ReportDetailScreen(){
 const {weekStart:week}=useParams(),s=useAppStore(v=>v.snapshot),report=s?.reports.find(r=>r.summary.week_start===week),a=useAction();
 return <Screen title="周报详情">{a.notice}<ReportFreshnessBadge stale={!report||report.source_evidence_revision!==s?.meta?.evidence_revision}/><OutcomeCountList result={report?ok(report.summary):null}/><button disabled={a.busy} onClick={()=>{if(week)void a.run(()=>actions().refreshWeek(week));}}>按最新记录重算</button><p><Link to="/reports">返回本周回看</Link></p></Screen>;
}

export function SettingsScreen(){return <Screen title="家长设置"><SceneAutoplaySetting/><ul>{[['weekly-goal','家长周目标'],['records','每日记录设置'],['profile','演示档案'],['voice','本机声音'],['privacy','隐私与同意'],['permissions','设备与离线说明'],['data','本机数据'],['help','帮助与边界']].map(([path,title])=><li key={path}><Link to={'/settings/'+path}>{title}</Link></li>)}<li key="about"><Link to="/about">体系说明（设计理念，可分享）</Link></li></ul></Screen>;}
export function ProfileSettingsScreen(){const p=useAppStore(v=>v.snapshot?.profile);return <Screen title="演示档案"><p>{p?'当前为演示孩子，不需要真实姓名。':'尚未建立档案。'}</p><p>当前暂不提供起点测级或儿童资料编辑，可以先试入门活动，再调整帮助方式。</p><Link className="button-link" to="/settings/weekly-goal">设置／查看周目标</Link><Link className="button-link" to="/themes">选择活动</Link></Screen>;}

export function VoiceSettingsScreen(){return <Screen title="本机美式声音"><p className="english"><AudioPhrase text="Hello! Let's play together."/></p><p>使用本机美式英语声线。</p></Screen>;}

export function PrivacySettingsScreen(){return <Screen title="隐私与同意"><p>孩子记录不上传；日志仅含固定技术码。不采集相机、录音、定位、通讯录信息。</p><p>当前演示不要求填写真实儿童资料；本机数据未另加应用层加密。导出的文件需由家长自行保管。</p><Link to="/settings/data">撤回并彻底清除本机数据</Link></Screen>;}
export function DataSettingsScreen(){
 const a=useAction(),navigate=useNavigate(),[confirm,setConfirm]=useState('');
 return <Screen title="本机数据管理"><ParentActionGate>{a.notice}<button onClick={()=>void a.run(exportRecords)}>导出已提交记录 JSON</button>
 <p>移除单条记录只让它退出统计。导出仅含已提交记录，不是完整备份，当前不提供导入恢复。彻底清除会删除本应用当前数据库的记录、草稿、同意及回执，以及播放进度、书签与安排评估，无法撤销；已导出的副本和旧脚手架数据库不在本次清除范围。</p>
 <label>输入“清除”确认<input value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>
 <button disabled={confirm!=='清除'||a.busy} onClick={()=>{cancelSpeech();void a.run(eraseLocalData,data=>{useAppStore.getState().accept(ok(data));navigate(landing(data));});}}>彻底清除／继续未完成清除</button>
 </ParentActionGate></Screen>;
}
export function HelpScreen(){return <Screen title="帮助与使用边界"><p>观察 → 选目标 → 亲子活动 → 记录 → 调整建议 → 周报。</p><p>未知用“没看清”，不当作失败。提示完成与独立完成分别记录。证据不足显示“不足以判断”。</p><p>儿童档位、时长及证据阈值均为产品假设。非剑桥官方等级，不提供诊断或综合分。</p><p>相机功能在V1被禁止。版权不清只建卡、零正文处理；不会绕过保护、去水印或云加工整书。</p><p>未加入Service Worker；Web首次离线无法加载。已打开页面的本地学习不依赖业务网络。原生壳离线能力待打包实测。</p><p><Link to="/about">体系说明：设计理念、证据强度与 AI 边界（可分享）</Link></p></Screen>;}
export function NotFoundScreen(){return <Screen title="这一页不存在"><EmptyState message="链接可能已失效；请从今日重新进入。"/><Link to="/today">回到今日</Link></Screen>;}
