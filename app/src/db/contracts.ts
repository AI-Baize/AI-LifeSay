import type { ActivityRecord, ActivitySession, AppMeta, Consent, Entity, NextStep, Observation, Profile, Settings, WeeklyReport } from '../content/types';
export interface Rows { profile: Profile; observations: Observation; activitySessions: ActivitySession; records: ActivityRecord; nextStep: NextStep; reports: WeeklyReport; settings: Settings; consent: Consent; }
export type RowTable = keyof Rows;
export type Change = { [K in RowTable]: { table: K; row: Rows[K]; expected_revision: number | null } }[RowTable];
export interface WriteCommand {
 idempotency_key: string; generation: string | null; now: number;
 kind: 'initialize' | 'grant' | 'withdraw' | 'save' | 'erase_begin' | 'erase_finish';
 changes: Change[]; initial_meta: AppMeta | null; expected_evidence_revision: number | null;
}
export function entity(id: string, key: string, now: number): Entity {
 return { id, idempotency_key:key,revision:1,created_at:now,updated_at:now,deleted_at:null,lifecycle_state:'active',data_mode:'demo',row_schema_version:1 };
}
