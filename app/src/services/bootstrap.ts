import { repository } from '../db/repository';
import { newId, newMeta } from './command';
import type { Snapshot } from '../content/types';
export function landing(snapshot: Snapshot): string {
 if(snapshot.meta?.maintenance_mode!=='normal') return '/settings/data';
 if(!snapshot.consent || snapshot.consent.granted_at===null || snapshot.consent.revoked_at!==null) return '/welcome';
 if(!snapshot.profile) return '/setup';
 return '/today';
}
export async function bootstrap() {
 const result=await repository.read();
 if(!result.ok || result.data.meta) return result;
 return repository.write({idempotency_key:newId(),generation:null,now:Date.now(),kind:'initialize',changes:[],initial_meta:newMeta(newId()),expected_evidence_revision:null});
}
