import type { AppMeta, Snapshot } from '../content/types';
import type { Change, WriteCommand } from '../db/contracts';
import { SCHEMA_VERSION } from '../db/migrations';
export const newId=():string=>crypto.randomUUID();
export function newMeta(generation: string): AppMeta {
 return {id:'local-app',database_generation:generation,current_profile_id:null,consent_sequence:0,evidence_revision:0,revision:1,maintenance_mode:'normal',maintenance_job_id:null,installed_schema_version:SCHEMA_VERSION};
}
export function command(snapshot: Snapshot, changes: Change[], key: string, now: number, kind: WriteCommand['kind']='save'): WriteCommand {
 return {idempotency_key:key,generation:snapshot.meta?.database_generation ?? null,now,kind,changes,initial_meta:null,expected_evidence_revision:null};
}
// 同一候选在重试时保留整个命令；修改候选后必须生成新键。revision只在事务内判定。
