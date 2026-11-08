import Dexie, { type Table } from 'dexie';
import { alignInstalledSchemaVersion, fillProfileV2, fillSessionV2 } from './migrations';
import type { Profile, Observation, ActivitySession, ActivityRecord, NextStep, WeeklyReport, Settings, Consent, Mutation, AuditLog, AppMeta, MaintenanceJob } from '../content/types';
export const CORE_SCHEMA = {
 profile: 'id,lifecycle_state',
 observations: 'id,[profile_id+lifecycle_state+observed_at],[profile_id+lifecycle_state]',
 activitySessions: 'id,[profile_id+lifecycle_state+status],[profile_id+created_at]',
 records: 'id,&session_id,[profile_id+lifecycle_state+occurred_at],[profile_id+lifecycle_state],[profile_id+selection_epoch_id]',
 nextStep: 'id,[profile_id+lifecycle_state],trigger_record_id',
 reports: 'id,&[profile_id+data_mode+week_start+timezone],[profile_id+lifecycle_state+week_start]',
 settings: 'id', consent: 'id,[scope+sequence]',
 mutations: 'idempotency_key,[database_generation+committed_at]',
 auditLog: 'id,occurred_at,event_code', appMeta: 'id', maintenanceJobs: 'id,[kind+status]'
};
export const V15_SCHEMA = { resources:'id,[lifecycle_state+updated_at],rights_status', assets:'id,[resource_id+lifecycle_state],availability', annotations:'id,[asset_id+lifecycle_state],publication_state', assetPayloads:'id,&asset_id' };
export class AppDatabase extends Dexie {
 profile!: Table<Profile,string>; observations!: Table<Observation,string>;
 activitySessions!: Table<ActivitySession,string>; records!: Table<ActivityRecord,string>;
 nextStep!: Table<NextStep,string>; reports!: Table<WeeklyReport,string>;
 settings!: Table<Settings,string>; consent!: Table<Consent,string>;
 mutations!: Table<Mutation,string>; auditLog!: Table<AuditLog,string>;
 appMeta!: Table<AppMeta,string>; maintenanceJobs!: Table<MaintenanceJob,string>;
 constructor(name = 'children-english-local-v1') {
   super(name); this.version(1).stores(CORE_SCHEMA);
   // schema v2：索引与 v1 相同（新字段不建索引），升级事务内把新字段统一填 null。
   // 不清库、不猜值；失败由 Dexie 回滚，旧数据保留。
   this.version(2).stores(CORE_SCHEMA).upgrade(tx =>
     tx.table('profile').toCollection().modify(fillProfileV2)
   ).upgrade(tx =>
     tx.table('activitySessions').toCollection().modify(fillSessionV2)
   ).upgrade(tx =>
     // R08：同步安装版本，避免物理 verno 与业务元数据不一致。
     tx.table('appMeta').toCollection().modify(alignInstalledSchemaVersion)
   );
   // V1.5媒体表仍仅声明合同；V1不注册、不启用。
   this.on('versionchange', () => this.close());
 }
}
