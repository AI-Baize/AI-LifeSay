import { fail, isPlanFeedback, ok, validRecord, type Result, type Snapshot, type ErrorCode } from '../content/types';
import { AppDatabase } from './schema';
import { MIGRATION_FAILURE_NOTICE, isMigrationFailure } from './migrations';
import type { WriteCommand } from './contracts';
import { validResult } from '../domain/validation';
import { findCourseUnit, isKnownUnitId } from '../domain/courseCatalog';
import { findContext } from '../content/contexts';
import { readCatalog } from '../content/catalog';
export class Rollback extends Error {
 code: ErrorCode;
 constructor(code: ErrorCode, message: string) { super(message); this.code=code; }
}
function reject(code: ErrorCode, message: string): never { throw new Rollback(code,message); }
const canonical = (v: unknown): string => {
 if (v===null || typeof v!=='object') return JSON.stringify(v) ?? 'null';
 if (Array.isArray(v)) return '['+v.map(canonical).join(',')+']';
 const obj=v as Record<string,unknown>;
 return '{'+Object.keys(obj).sort().map(k=>JSON.stringify(k)+':'+canonical(obj[k])).join(',')+'}';
};
export interface Repository { read(): Promise<Result<Snapshot>>; write(command: WriteCommand): Promise<Result<Snapshot>>; }

// C-10/G-4：读取失败的分类。升级失败给专用错误码与专用提示，
// 不落成普通 STORAGE_ERROR；不静默清库、不用空记录替代。
export function classifyReadFailure(error: unknown): { code: ErrorCode; message: string; retryable: boolean } {
 if (isMigrationFailure(error))
  return { code: 'MIGRATION_FAILED', message: MIGRATION_FAILURE_NOTICE, retryable: true };
 return { code: 'STORAGE_ERROR', message: '无法读取本机数据，请重试；不会用空记录替代读取失败。', retryable: true };
}
export function createRepository(name='children-english-local-v1'): Repository {
 const read = async (): Promise<Result<Snapshot>> => {
  const db=new AppDatabase(name);
  try {
   return await db.transaction('r',db.tables,async()=>{
    const meta=await db.appMeta.get('local-app') ?? null;
    const profile=meta?.current_profile_id ? await db.profile.get(meta.current_profile_id) ?? null : null;
    const consents=await db.consent.toArray();
    const consent=consents.sort((a,b)=>b.sequence-a.sequence)[0] ?? null;
    return ok({meta,profile,consent,settings:await db.settings.get('local-settings') ?? null,
     observations:await db.observations.toArray(),sessions:await db.activitySessions.toArray(),
     records:await db.records.toArray(),suggestions:await db.nextStep.toArray(),reports:await db.reports.toArray()});
   });
  } catch (error) {
   // C-10/G-4：升级失败给专用提示（复用 MIGRATION_FAILURE_NOTICE），
   // 不落成普通 STORAGE_ERROR；不改动旧数据、不静默清库。
   const classified = classifyReadFailure(error);
   return fail(classified.code, classified.message, classified.retryable);
  }
  finally { db.close(); }
 };
 return { read, async write(command) {
  const db=new AppDatabase(name);
  try {
   if(!Number.isSafeInteger(command.now) || command.now<0 || !command.idempotency_key.trim()) return fail('INVALID_INPUT','命令时间或提交键无效');
   if((command.kind==='grant'||command.kind==='withdraw') && (command.changes.length!==1 || command.changes[0]?.table!=='consent'))
    return fail('INVALID_INPUT','同意命令只能写同意事件');
   if(command.kind==='save' && command.changes.some(c=>c.table==='consent')) return fail('INVALID_INPUT','同意事件需要单独命令');
   const bytes=new TextEncoder().encode(canonical(command));
   const digest=await crypto.subtle.digest('SHA-256',bytes);
   const fingerprint=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
   await db.transaction('rw',db.tables,async()=>{
    let meta=await db.appMeta.get('local-app');
    if(command.kind==='initialize'){
     if(meta) return;
     if(!command.initial_meta || command.generation!==null || command.initial_meta.current_profile_id!==null || command.initial_meta.evidence_revision!==0 || command.initial_meta.maintenance_mode!=='normal') reject('INVALID_INPUT','初始化参数无效');
     await db.appMeta.add(command.initial_meta); return;
    }
    if(!meta || meta.database_generation!==command.generation) reject('STALE_GENERATION','数据已清除或重新初始化，请重新打开');
    if(command.kind==='erase_finish'){
     if(meta.maintenance_mode!=='erasing') reject('INVALID_INPUT','没有待完成的清除任务');
     const next=command.initial_meta;
     if(!next || next.database_generation===meta.database_generation) reject('INVALID_INPUT','必须建立新数据代次');
     for(const table of db.tables) await table.clear();
     // C-12：围栏 + 清理 + 验证后才报成功；不静默清库。
     // 逐表复核残留，任一表非空即中止（事务回滚），不宣称清除完成。
     for(const table of db.tables){
      const residual=await table.count();
      if(residual!==0) reject('STORAGE_ERROR','清除未完全生效，请重试');
     }
     await db.appMeta.add(next);
     const written=await db.appMeta.get('local-app');
     if(!written || written.database_generation!==next.database_generation || written.current_profile_id!==null)
      reject('STORAGE_ERROR','清除未确认，请重试');
     return;
    }
    if(meta.maintenance_mode!=='normal') reject('MAINTENANCE_BUSY','维护进行中，暂停写入');
    if(command.kind==='erase_begin'){
     const jobId=command.idempotency_key;
     await db.maintenanceJobs.put({id:jobId,kind:'erase',status:'pending',generation:meta.database_generation,created_at:command.now});
     await db.appMeta.put({...meta,maintenance_mode:'erasing',maintenance_job_id:jobId,revision:meta.revision+1}); return;
    }
    const consents=await db.consent.toArray();
    const consent=consents.sort((a,b)=>b.sequence-a.sequence)[0];
    if(command.kind==='save' && (!consent || consent.granted_at===null || consent.revoked_at!==null))
      reject('CONSENT_REQUIRED','请先由家长确认本机数据说明');
    const receipt=await db.mutations.get(command.idempotency_key);
    if(receipt){
     if(receipt.request_fingerprint!==fingerprint) reject('IDEMPOTENCY_CONFLICT','同一提交键不能对应不同内容');
     return;
    }
    if(command.expected_evidence_revision!==null && meta.evidence_revision!==command.expected_evidence_revision)
      reject('STALE_EVIDENCE','证据已变化，请刷新建议或周报');
    let evidenceChanged=false;
    for(const change of command.changes){
     const row=change.row;
     const previous=await db.table(change.table).get(row.id) as {revision:number}|undefined;
     if((previous?.revision ?? null)!==change.expected_revision) reject('CONFLICT','其他窗口已修改，请重读后确认');
     if(row.revision!==(previous ? previous.revision+1 : 1) || row.idempotency_key!==command.idempotency_key ||
       row.data_mode!=='demo' || (row.deleted_at===null)!==(row.lifecycle_state==='active'))
       reject('INVALID_INPUT','行版本、模式或删除状态无效');
     if('profile_id' in row && change.table!=='consent' && row.profile_id!==meta.current_profile_id)
       reject('INVALID_INPUT','档案引用不匹配');
     if(change.table==='consent'){
      if(change.row.sequence!==meta.consent_sequence+1 || !change.row.declared_guardian ||
         change.row.database_generation!==meta.database_generation || previous) reject('INVALID_INPUT','同意事件顺序或声明无效');
      meta={...meta,consent_sequence:change.row.sequence};
     }
     if(change.table==='observations'){
      if(!validResult(change.row.result) || change.row.outcome!==change.row.result.outcome) reject('INVALID_INPUT','观察结果无效');
      const catalog=readCatalog();if(!catalog.ok) reject('INVALID_INPUT','内容不可用');
      const observation=change.row;
      const task=catalog.data.find(t=>t.id===observation.theme_id)?.tasks.find(t=>t.id===observation.task_id);
      if(!task || task.goal_id!==change.row.goal_id) reject('INVALID_INPUT','观察目标引用无效');
     }
     if(change.table==='settings'){
      const pref=change.row;if(pref.scene_autoplay!==undefined&&typeof pref.scene_autoplay!=='boolean')reject('INVALID_INPUT','自动播放设置无效');if(pref.daily_record_enabled!==undefined&&typeof pref.daily_record_enabled!=='boolean'||pref.daily_record_time!==undefined&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(pref.daily_record_time))reject('INVALID_INPUT','每日记录设置无效');
     }
     if(change.table==='profile'){
      const goals=change.row.weekly_goals;
      if(goals!==undefined&&(!goals||typeof goals!=='object'||Array.isArray(goals)||Object.entries(goals).some(([week,text])=>!/^\d{4}-\d{2}-\d{2}$/.test(week)||typeof text!=='string'||!text.trim()||text.length>200)))reject('INVALID_INPUT','周目标无效');
      const goalSavedAt=change.row.weekly_goal_saved_at;
      if(goalSavedAt!==undefined&&(!goalSavedAt||typeof goalSavedAt!=='object'||Array.isArray(goalSavedAt)||Object.entries(goalSavedAt).some(([week,time])=>!/^\d{4}-\d{2}-\d{2}$/.test(week)||!goals||!Object.prototype.hasOwnProperty.call(goals,week)||!Number.isSafeInteger(time)||Number(time)<0)))reject('INVALID_INPUT','周目标保存时间无效');
      if(meta.current_profile_id!==null && meta.current_profile_id!==row.id) reject('CONFLICT','V1仅允许一个档案');
      const selection=change.row.selection;
      if(selection){
       const catalog=readCatalog(); if(!catalog.ok) reject('INVALID_INPUT','内容不可用');
       const theme=catalog.data.find(t=>t.id===selection.theme_id);
       const task=theme?.tasks.find(t=>t.id===selection.task_id);
       if(!theme || theme.rights.mode==='card_only' || !task || task.goal_id!==selection.goal_id ||
          selection.content_version!==theme.version || selection.profile_id!==row.id ||
          selection.level!==selection.support_level) reject('INVALID_INPUT','目标内容引用无效');
       // R01：课程身份必须与课程目录一致；不得自造课程/单元/条件组合。
       if(selection.course_id!==null && selection.course_id!==undefined){
        const unit=findCourseUnit(selection.theme_id,selection.task_id,selection.course_id);
        const ctx=selection.observation_condition_key ? findContext(selection.observation_condition_key) : null;
        if(!unit.ok || unit.data.unit_id!==selection.unit_id || !ctx?.ok ||
           !unit.data.context_ids.includes(ctx.data.context_id) || ctx.data.observation_condition_key!==selection.observation_condition_key)
         reject('INVALID_INPUT','目标课程身份与课程目录不一致');
       }
      }
      meta={...meta,current_profile_id:row.id};
     }
     if(change.table==='activitySessions'){
      const session=change.row;
      if(!Number.isInteger(session.current_step_index) || session.current_step_index<0 || session.current_step_index>3)
       reject('INVALID_INPUT','活动步骤无效');
      // R09：评估结构必须通过统一守卫，非法负载不得绕过 TS 类型写入。
      if(session.plan_feedback!==null && session.plan_feedback!==undefined && !isPlanFeedback(session.plan_feedback))
       reject('INVALID_INPUT','评估结构无效');
      if(previous){
       const old=await db.activitySessions.get(session.id);
       if(!old || canonical(old.selection_snapshot)!==canonical(session.selection_snapshot) || old.profile_id!==session.profile_id)
        reject('INVALID_INPUT','会话目标快照不能被改写');
       // R01：课程身份创建后冻结，同会话不得改课/改单元/改观察条件。
       if(old.course_id!==session.course_id || old.unit_id!==session.unit_id ||
         old.observation_condition_key!==session.observation_condition_key)
        reject('INVALID_INPUT','课程身份在会话内冻结，跨课程请新建会话');
       if(old.initial_presentation_mode!==session.initial_presentation_mode)
        reject('INVALID_INPUT','初始呈现模式在会话内冻结');
       const transitions:Record<string,string[]>={
        active:['active','paused','awaiting_record'],paused:['active','paused','awaiting_record'],
        awaiting_record:['pending_record','recorded'],pending_record:['pending_record','recorded'],
        recorded:[],abandoned:[]
       };
       if(!transitions[old.status]?.includes(session.status)) reject('INVALID_INPUT','非法活动状态转换');
      }
      if(!previous){
       // R01：新建会话必须冻结完整课程身份；缺身份不建课。
       if(session.course_id===null || session.course_id===undefined ||
         session.unit_id===null || session.unit_id===undefined ||
         session.initial_presentation_mode===null || session.initial_presentation_mode===undefined ||
         session.current_presentation_mode===null || session.current_presentation_mode===undefined ||
         session.observation_condition_key===null || session.observation_condition_key===undefined)
        reject('INVALID_INPUT','新建会话必须明确课程、单元、呈现模式与观察条件');
       if(!isKnownUnitId(session.unit_id)) reject('INVALID_INPUT','会话单元不在课程目录中');
       if(session.course_id!==session.initial_presentation_mode ||
         session.initial_presentation_mode!==session.current_presentation_mode)
        reject('INVALID_INPUT','课程与呈现模式必须一致');
       const existing=await db.activitySessions.toArray();
       if(existing.some(s=>s.profile_id===session.profile_id && s.deleted_at===null && ['active','paused'].includes(s.status)))
        reject('CONFLICT','已有未完成活动，请先继续或结束');
       const profile=await db.profile.get(session.profile_id);
       if(!profile?.selection || profile.selection.selection_id!==session.selection_snapshot.selection_id)
        reject('CONFLICT','目标已改变，请重新确认');
       // R01：跨课目标必须与当前课程身份一致，不得用旧课快照开新课。
       if(profile.selection.course_id!==session.course_id ||
         profile.selection.observation_condition_key!==session.observation_condition_key)
        reject('INVALID_INPUT','目标课程与观察条件必须与新会话一致');
      }
     }
     if(change.table==='nextStep' && change.row.decision_state==='accepted'){
      const profileChange=command.changes.find(c=>c.table==='profile');
      if(!profileChange || profileChange.expected_revision!==change.row.source_profile_revision ||
         change.row.source_evidence_revision!==meta.evidence_revision) reject('STALE_EVIDENCE','建议证据已失效');
     }
     if(change.table==='records'){
      const record=change.row;
      if(!validRecord(record) || !validResult(record.result) || record.result.outcome!==record.outcome ||
        record.result.participation!==record.participation) reject('INVALID_INPUT','表现记录不符合观察约束');
      const session=await db.activitySessions.get(record.session_id);
      if(!session || session.profile_id!==record.profile_id ||
        session.selection_epoch_id!==record.selection_epoch_id) reject('INVALID_INPUT','会话引用无效');
      if(!command.changes.some(c=>c.table==='activitySessions' && c.row.id===record.session_id && c.row.record_id===record.id) && !previous)
       reject('INVALID_INPUT','记录必须和会话结束状态原子提交');
      if(canonical(record.selection_snapshot)!==canonical(session.selection_snapshot) ||
        record.theme_id!==session.selection_snapshot.theme_id || record.task_id!==session.selection_snapshot.task_id ||
        record.goal_id!==session.selection_snapshot.goal_id || record.level!==session.selection_snapshot.level ||
        record.content_version!==session.selection_snapshot.content_version ||
        record.occurred_at<session.started_at || record.occurred_at>command.now)
       reject('INVALID_INPUT','记录与会话目标或发生时间不一致');
      evidenceChanged=true;
     }
     if(change.table==='reports' && (change.row.source_evidence_revision!==meta.evidence_revision ||
       change.row.profile_id!==meta.current_profile_id || change.row.week_start!==change.row.summary.week_start))
       reject('STALE_EVIDENCE','周报依据或唯一标识无效');
     await db.table(change.table).put(row);
    }
    await db.appMeta.put({...meta,evidence_revision:meta.evidence_revision+(evidenceChanged?1:0),revision:meta.revision+1});
    await db.mutations.add({idempotency_key:command.idempotency_key,database_generation:meta.database_generation,
      request_fingerprint:fingerprint,committed_at:command.now,command_type:command.kind});
    await db.auditLog.add({id:command.idempotency_key,occurred_at:command.now,event_code:'WRITE_OK'});
   });
   // Dexie事务Promise完成即已commit；重读失败不宣称写入回滚。
   return await read();
  } catch(error) {
   if (error instanceof Rollback) return fail(error.code,error.message);
   // C-10/G-4：写入路径同样识别升级失败，不落成普通保存失败。
   const classified = classifyReadFailure(error);
   if (classified.code === 'MIGRATION_FAILED') return fail(classified.code, classified.message, classified.retryable);
   return fail('STORAGE_ERROR','保存未确认，请使用同一提交重试。',true);
  } finally { db.close(); }
 }};
}
export const repository=createRepository();
