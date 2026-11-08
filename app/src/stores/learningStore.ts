import { create } from 'zustand';
import { fail, type ActivityRecord, type ActivitySession, type Consent, type CourseUnitRef, type Level, type NextStep, type ObservationResult, type Profile, type Result, type Snapshot, type TargetSelection, type Theme, type WeeklyReport } from '../content/types';
import { entity, type Change, type WriteCommand } from '../db/contracts';
import { repository } from '../db/repository';
import { command, newId } from '../services/command';
import { useAppStore } from './appStore';
import { useUiStore } from './uiStore';
import { suggestNextStep } from '../domain/next-step';
import { buildWeeklyReport } from '../domain/weeklyReport';
import { localWeek, validTime, WEEKLY_GOAL_RETENTION_MS, weeklyGoalExpiresAt } from '../domain/parentPlan';
import { validResult } from '../domain/validation';
type Response=Promise<Result<Snapshot>>;
let pending:WriteCommand|null=null;
const state=()=>useAppStore.getState().snapshot;
async function commit(changes:Change[],key:string,now:number,kind:WriteCommand['kind']='save',evidence:number|null=null):Response{
 const snapshot=state();if(!snapshot)return fail('NOT_FOUND','数据尚未就绪');
 const input=command(snapshot,changes,key,now,kind);input.expected_evidence_revision=evidence;pending=input;
 return send(input);
}
async function send(input:WriteCommand):Response{
 useUiStore.getState().setSave('saving');const result=await repository.write(input);
 if(result.ok){pending=null;useAppStore.getState().accept(result);useUiStore.getState().setSave('saved');}
 else useUiStore.getState().setSave('error');
 return result;
}
function updated<T extends {revision:number;idempotency_key:string;updated_at:number}>(row:T,key:string,now:number):T{
 return {...row,revision:row.revision+1,idempotency_key:key,updated_at:now};
}
interface LearningState {
 saveSceneAutoplay:(enabled:boolean)=>Response;
 saveWeeklyGoal:(week:string,goal:string)=>Response;
 pruneExpiredWeeklyGoals:()=>Response;
 saveRecordPreferences:(enabled:boolean,time:string)=>Response;
 retry:()=>Response;
 grant:()=>Response; setup:()=>Response;
 saveObservation:(theme:Theme,result:ObservationResult,taskId?:string)=>Response;
 confirmSelection:(theme:Theme,level:Level,ref:CourseUnitRef,taskId?:string)=>Response;
 switchCourse:(ref:CourseUnitRef)=>Response;
 startActivity:()=>Response;
 saveCheckpoint:(id:string,index:number)=>Response;
 pauseActivity:(id:string)=>Response;
 endActivity:(id:string,kind:'completed'|'stopped'|'refused')=>Response;
 saveDraft:(id:string,result:ObservationResult)=>Response;
 submitRecord:(id:string,result:ObservationResult,context:string|null)=>Response;
 correctRecord:(id:string,result:ObservationResult)=>Response;
 deleteRecord:(id:string)=>Response;
 loadNextStep:(id:string)=>Response;
 acceptNextStep:(id:string)=>Response;
 dismissNextStep:(id:string)=>Response;
 loadWeek:(week:string)=>Response;refreshWeek:(week:string)=>Response;
}
async function sessionUpdate(id:string,patch:Partial<Pick<ActivitySession,'current_step_index'|'status'|'ended_at'|'checkpoint_at'|'completion_kind'|'record_draft'>>):Response{
 const row=state()?.sessions.find(s=>s.id===id && s.deleted_at===null);if(!row)return fail('NOT_FOUND','活动不存在');
 if(row.status==='recorded' || row.status==='abandoned')return fail('INVALID_INPUT','该活动不能继续修改');
 const key=newId(),now=Date.now();
 return commit([{table:'activitySessions',row:{...updated(row,key,now),...patch},expected_revision:row.revision}],key,now);
}
export const useLearningStore=create<LearningState>((_set,get)=>({
 async saveSceneAutoplay(enabled){
  const s=state();if(!s?.profile)return fail('NOT_FOUND','请先建立本机档案');
  if(typeof enabled!=='boolean')return fail('INVALID_INPUT','自动播放设置无效');
  const old=s.settings,key=newId(),now=Date.now();return commit([{table:'settings',row:{...(old?updated(old,key,now):{...entity('local-settings',key,now),locale:'en-US',preferred_voice_uri:null}),scene_autoplay:enabled},expected_revision:old?.revision??null}],key,now);
 },
 async saveWeeklyGoal(week,goal){
  const p=state()?.profile;if(!p)return fail('NOT_FOUND','请先建立档案');
  const parsed=new Date(week+'T12:00:00');if(!/^\d{4}-\d{2}-\d{2}$/.test(week)||!Number.isFinite(parsed.getTime())||localWeek(parsed.getTime())!==week||!goal.trim()||goal.trim().length>200)return fail('INVALID_INPUT','请选择周一并填写200字以内的目标');
  const key=newId(),now=Date.now(),cutoff=now-WEEKLY_GOAL_RETENTION_MS;
  const goals:Record<string,string>={},savedAt:Record<string,number>={};
  for(const [storedWeek,text] of Object.entries(p.weekly_goals??{})){
   const timestamp=p.weekly_goal_saved_at?.[storedWeek];
   if(weeklyGoalExpiresAt(storedWeek,timestamp)>now&&(!timestamp||timestamp>=cutoff)){goals[storedWeek]=text;if(timestamp)savedAt[storedWeek]=timestamp;}
  }
  goals[week]=goal.trim();savedAt[week]=now;
  return commit([{table:'profile',row:{...updated(p,key,now),weekly_goals:goals,weekly_goal_saved_at:savedAt},expected_revision:p.revision}],key,now);
 },
 async pruneExpiredWeeklyGoals(){
  const snapshot=state(),p=snapshot?.profile;if(!snapshot)return fail('NOT_FOUND','数据尚未就绪');if(!p)return fail('NOT_FOUND','请先建立档案');
  const now=Date.now(),goals:Record<string,string>={},savedAt:Record<string,number>={};
  for(const [week,text] of Object.entries(p.weekly_goals??{})){
   const timestamp=p.weekly_goal_saved_at?.[week];
   if(weeklyGoalExpiresAt(week,timestamp)>now){goals[week]=text;if(timestamp)savedAt[week]=timestamp;}
  }
  if(Object.keys(goals).length===Object.keys(p.weekly_goals??{}).length)return {ok:true as const,data:snapshot};
  const key=newId();return commit([{table:'profile',row:{...updated(p,key,now),weekly_goals:goals,weekly_goal_saved_at:savedAt},expected_revision:p.revision}],key,now);
 },
 async saveRecordPreferences(enabled,time){
  const s=state();if(!s?.profile)return fail('NOT_FOUND','请先建立档案');if(!validTime(time))return fail('INVALID_INPUT','请选择有效时间');
  const old=s.settings,key=newId(),now=Date.now();return commit([{table:'settings',row:{...(old?updated(old,key,now):{...entity('local-settings',key,now),locale:'en-US',preferred_voice_uri:null}),daily_record_enabled:enabled,daily_record_time:time},expected_revision:old?.revision??null}],key,now);
 },
 retry:()=>pending?send(pending):Promise.resolve(fail('NOT_FOUND','没有待重试的提交')),
 async grant(){
  const s=state();if(!s)return fail('NOT_FOUND','尚未初始化');
  const key=newId(),now=Date.now();
  const row:Consent={...entity(newId(),key,now),profile_id:s.profile?.id ?? 'pending',policy_version:'local-demo-v1',granted_at:now,revoked_at:null,scope:'local_child_learning',sequence:(s.meta?.consent_sequence ?? 0)+1,decision:'granted',database_generation:s.meta?.database_generation ?? '',actor_role:'guardian_declared',declared_guardian:true};
  return commit([{table:'consent',row,expected_revision:null}],key,now,'grant');
 },
 async setup(){
  const s=state();if(!s)return fail('NOT_FOUND','尚未初始化');
  if(s.profile)return {ok:true,data:s};
  const key=newId(),now=Date.now();
  const row:Profile={...entity(newId(),key,now),is_demo:true,nickname:'演示孩子',display_name:null,age_band:null,age_months:null,selection:null,preferred_locale:'en-US',initialized_at:now,archived_reason:null,
   // R07：新行显式写入 v2 字段（未知写 null），不依赖一次性 upgrade。
   age_scope:null,english_exposure:null,entry_band_preference:null,entry_band_source:null,entry_rule_version:null,scenario_preset:null,onboarding_completed_at:null};
  return commit([{table:'profile',row,expected_revision:null}],key,now);
 },
 async saveObservation(theme,result,taskId){
  const p=state()?.profile,task=taskId?theme.tasks.find(t=>t.id===taskId):theme.tasks[0];if(!p || !task || !validResult(result))return fail('INVALID_INPUT','请完成观察选择');
  const key=newId(),now=Date.now();
  return commit([{table:'observations',row:{...entity(newId(),key,now),profile_id:p.id,goal_id:task.goal_id,observed_at:now,outcome:result.outcome,theme_id:theme.id,task_id:task.id,content_version:theme.version,ability_id:task.goal_id,result},expected_revision:null}],key,now);
 },
 async confirmSelection(theme,level,ref,taskId){
  const p=state()?.profile,task=taskId?theme.tasks.find(t=>t.id===taskId):theme.tasks[0];if(!p || !task)return fail('NOT_FOUND','目标不可用');
  // R01：目标必须带完整课程身份；缺身份不保存，避免日后无法区分事实。
  if(!ref || !ref.course_id || !ref.unit_id || !ref.observation_condition_key)
   return fail('INVALID_INPUT','目标缺少课程、单元或观察条件，请重新确认');
  const key=newId(),now=Date.now();
  const old=p.selection;
  const compatible=old?.theme_id===theme.id && old.content_version===theme.version && old.task_id===task.id && old.level===level
   && old.course_id===ref.course_id && old.unit_id===ref.unit_id && old.observation_condition_key===ref.observation_condition_key;
  const selection:TargetSelection={
   profile_id:p.id,theme_id:theme.id,content_version:theme.version,task_id:task.id,goal_id:task.goal_id,level,
   level_started_at:compatible?old.level_started_at:now,selection_id:newId(),selection_epoch_id:compatible?old.selection_epoch_id:newId(),
   ability_id:task.goal_id,ability_definition_version:theme.version,support_level:level,locale:'en-US',selected_at:now,source:'manual',
   source_observation_id:null,source_next_step_id:null,target_label_snapshot:task.goal_zh,support_label_snapshot:['一起说','先等再帮','换个场景'][level] ?? '一起说',
   course_id:ref.course_id,unit_id:ref.unit_id,observation_condition_key:ref.observation_condition_key
  };
  return commit([{table:'profile',row:{...updated(p,key,now),selection},expected_revision:p.revision}],key,now);
 },
 async switchCourse(ref){
  const s=state(),p=s?.profile,sel=p?.selection;if(!s || !p || !sel)return fail('NOT_FOUND','请先确认目标');
  // I-1：跨课切换必新建会话；已开始时先处理旧课，不原地改课程身份。
  if(!ref || !ref.course_id || !ref.unit_id || !ref.observation_condition_key)
   return fail('INVALID_INPUT','目标缺少课程、单元或观察条件，请重新确认');
  const active=s.sessions.find(r=>r.deleted_at===null && ['active','paused'].includes(r.status));
  if(active)return fail('CONFLICT','当前课程活动尚未结束；请先结束或保留待补记，再开始另一门课程');
  if(sel.course_id===ref.course_id && sel.unit_id===ref.unit_id && sel.observation_condition_key===ref.observation_condition_key)
   return {ok:true,data:s};
  const key=newId(),now=Date.now();
  // 换课即换选择周期（新 epoch）；支持方式与目标保持不变，仅课程身份变化。
  const selection:TargetSelection={...sel,course_id:ref.course_id,unit_id:ref.unit_id,observation_condition_key:ref.observation_condition_key,
   selection_id:newId(),selection_epoch_id:newId(),selected_at:now,source:'manual',source_observation_id:null,source_next_step_id:null};
  return commit([{table:'profile',row:{...updated(p,key,now),selection},expected_revision:p.revision}],key,now);
 },
 async startActivity(){
  const s=state(),p=s?.profile,selection=p?.selection;if(!s || !p || !selection)return fail('NOT_FOUND','请先确认目标');
  const active=s.sessions.find(r=>r.deleted_at===null && ['active','paused'].includes(r.status));
  // I-6 / 13-审校记录 §4：迁移情境是新观察条件，必须另建会话。
  // 存在进行中会话但课程/单元/观察条件已变化时，禁止静默复用（否则会跨条件合并证据），
  // 必须先结束或保留待补记，再新建会话。
  if(active){
   const same=active.course_id===selection.course_id && active.unit_id===selection.unit_id && active.observation_condition_key===selection.observation_condition_key;
   if(!same)return fail('CONFLICT','当前活动属于另一观察条件；请先结束或保留待补记，再按新情境新建活动');
   return {ok:true,data:s};
  }
  // R01：课程身份必须冻结；缺身份不建课。
  if(!selection.course_id || !selection.unit_id || !selection.observation_condition_key)
   return fail('INVALID_INPUT','目标缺少课程身份，请重新确认目标');
  const key=newId(),now=Date.now();
  const row:ActivitySession={...entity(newId(),key,now),profile_id:p.id,selection_snapshot:selection,selection_epoch_id:selection.selection_epoch_id,status:'active',started_at:now,ended_at:null,current_step_index:0,checkpoint_at:now,record_id:null,record_draft:null,completion_kind:null,
   // R07/R01：新会话显式写全 v2 字段，并把课程/条件从目标快照冻结下来。
   course_id:selection.course_id,unit_id:selection.unit_id,initial_presentation_mode:selection.course_id,current_presentation_mode:selection.course_id,observation_condition_key:selection.observation_condition_key,plan_feedback:null,proposed_next_preference:null};
  return commit([{table:'activitySessions',row,expected_revision:null}],key,now);
 },
 saveCheckpoint:(id,index)=>Number.isInteger(index)&&index>=0&&index<=3 ? sessionUpdate(id,{current_step_index:index,checkpoint_at:Date.now(),status:'active'}) : Promise.resolve(fail('INVALID_INPUT','步骤无效')),
 pauseActivity:id=>sessionUpdate(id,{status:'paused',checkpoint_at:Date.now()}),
 endActivity:(id,kind)=>sessionUpdate(id,{status:'awaiting_record',ended_at:Date.now(),completion_kind:kind,checkpoint_at:Date.now()}),
 saveDraft:(id,result)=>sessionUpdate(id,{record_draft:result,status:'pending_record'}),
 async submitRecord(id,result,context){
  const s=state(),session=s?.sessions.find(r=>r.id===id);
  if(!s || !session || !validResult(result))return fail('INVALID_INPUT','请如实填写参与状态与表现');
  if(!['awaiting_record','pending_record'].includes(session.status))return fail('INVALID_INPUT','请先结束活动');
  if(session.completion_kind==='refused' && result.participation!=='refused' || session.completion_kind==='stopped' && result.participation!=='stopped')
   return fail('INVALID_INPUT','提前结束状态与记录不一致');
  const key=newId(),now=Date.now(),recordId=newId(),selection=session.selection_snapshot;
  const row:ActivityRecord={...entity(recordId,key,now),...selection,session_id:id,selection_snapshot:selection,selection_epoch_id:selection.selection_epoch_id,
    occurred_at:session.ended_at ?? now,context_id:context,participation:result.participation,outcome:result.outcome,result,duration_seconds:null};
  return commit([{table:'records',row,expected_revision:null},
   {table:'activitySessions',row:{...updated(session,key,now),status:'recorded',record_id:recordId,record_draft:null},expected_revision:session.revision}],key,now);
 },
 async correctRecord(id,result){
  const row=state()?.records.find(r=>r.id===id);if(!row || !validResult(result))return fail('INVALID_INPUT','记录不可用或输入不完整');
  const key=newId(),now=Date.now();
  return commit([{table:'records',row:{...updated(row,key,now),result,outcome:result.outcome,participation:result.participation,context_id:result.environment===undefined?row.context_id:result.environment},expected_revision:row.revision}],key,now);
 },
 async deleteRecord(id){
  const row=state()?.records.find(r=>r.id===id);if(!row)return fail('NOT_FOUND','记录不存在');
  const key=newId(),now=Date.now();
  return commit([{table:'records',row:{...updated(row,key,now),deleted_at:now,lifecycle_state:'deleted'},expected_revision:row.revision}],key,now);
 },
 async loadNextStep(id){
  const s=state(),p=s?.profile,record=s?.records.find(r=>r.id===id);
  if(!s?.meta || !p?.selection || !record || record.deleted_at!==null)return fail('NOT_FOUND','没有有效记录');
  const key=newId(),now=Date.now();
  const row:NextStep={...entity(newId(),key,now),profile_id:p.id,trigger_record_id:id,selection_epoch_id:p.selection.selection_epoch_id,
   source_profile_revision:p.revision,source_evidence_revision:s.meta.evidence_revision,rule_version:'next-step-v1',evaluated_at:now,
   suggestion:suggestNextStep(p.selection,s.records,now,'next-step-v1',p.selection.selection_epoch_id),decision_state:'pending'};
  return commit([{table:'nextStep',row,expected_revision:null}],key,now,'save',s.meta.evidence_revision);
 },
 async acceptNextStep(id){
  const s=state(),p=s?.profile,row=s?.suggestions.find(r=>r.id===id);
  if(!s?.meta || !p?.selection || !row || row.decision_state!=='pending')return fail('NOT_FOUND','建议不可用');
  if(row.source_profile_revision!==p.revision || row.selection_epoch_id!==p.selection.selection_epoch_id || row.source_evidence_revision!==s.meta.evidence_revision)
   return fail('STALE_EVIDENCE','证据或目标已变化，请重新生成建议');
  const key=newId(),now=Date.now(),level=row.suggestion.target_level;
  const changed=level!==p.selection.level;
  const selection:TargetSelection={...p.selection,level,support_level:level,selection_id:newId(),
   selection_epoch_id:changed?newId():p.selection.selection_epoch_id,level_started_at:changed?now:p.selection.level_started_at,
   selected_at:now,source:'recommendation',source_next_step_id:id,support_label_snapshot:['一起说','先等再帮','换个场景'][level] ?? '一起说'};
  return commit([{table:'profile',row:{...updated(p,key,now),selection},expected_revision:p.revision},
   {table:'nextStep',row:{...updated(row,key,now),decision_state:'accepted'},expected_revision:row.revision}],key,now,'save',row.source_evidence_revision);
 },
 async dismissNextStep(id){
  const row=state()?.suggestions.find(r=>r.id===id);if(!row)return fail('NOT_FOUND','建议不存在');
  const key=newId(),now=Date.now();
  return commit([{table:'nextStep',row:{...updated(row,key,now),decision_state:'dismissed'},expected_revision:row.revision}],key,now);
 },
 loadWeek:week=>get().refreshWeek(week),
 async refreshWeek(week){
  const s=state(),p=s?.profile;if(!s?.meta || !p)return fail('NOT_FOUND','档案尚未就绪');
  const key=newId(),now=Date.now();
  const result=buildWeeklyReport({profile_id:p.id,week_start:week,generated_at:now,records:s.records});
  if(!result.ok)return result;
  const previous=s.reports.find(r=>r.summary.week_start===week);
  const row:WeeklyReport={...(previous?updated(previous,key,now):entity(newId(),key,now)),profile_id:p.id,week_start:week,timezone:'Asia/Shanghai',source_evidence_revision:s.meta.evidence_revision,rule_version:'weekly-v1',summary:result.data};
  return commit([{table:'reports',row,expected_revision:previous?.revision ?? null}],key,now,'save',s.meta.evidence_revision);
 }
}));
