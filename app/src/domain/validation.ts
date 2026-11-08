import type { ObservationResult, Observation } from '../content/types';
export { isInstant, isOutcome, isLevel, validRecord } from '../content/types';
export function validResult(r: ObservationResult): boolean {
  if (!['not_observed','unclear','stopped','refused','missing_legacy',null].includes(r.unknown_reason) ||
      !(r.prompt_types===null || Array.isArray(r.prompt_types) && r.prompt_types.every(p=>['model_answer','verbal_cue','gesture_cue','physical_help','other'].includes(p)))) return false;
  if (!['engaged','stopped','refused',null].includes(r.participation) ||
      !['independent','prompted','not_yet',null].includes(r.outcome) ||
      (r.note!==null && (typeof r.note!=='string' || r.note.length>200))) return false;
  if (r.outcome===null) return r.unknown_reason!==null &&
    (r.participation!=='refused' || r.unknown_reason==='refused') &&
    (r.participation!=='stopped' || r.unknown_reason==='stopped');
  if (r.participation!=='engaged' || r.opportunity_observed!==true || r.unknown_reason!==null) return false;
  if (r.outcome==='independent') return Array.isArray(r.prompt_types) && r.prompt_types.length===0;
  if (r.outcome==='prompted') return Array.isArray(r.prompt_types) && r.prompt_types.length>0;
  return true;
}
export function validObservation(r: Observation): boolean {
  return !!r.profile_id && !!r.goal_id && Number.isSafeInteger(r.observed_at) &&
    [null,'independent','prompted','not_yet'].includes(r.outcome);
}
