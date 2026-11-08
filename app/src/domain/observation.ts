import { fail, ok, type Level, type ObservationResult, type Result } from '../content/types';
import { validResult } from './validation';
export function observationSupport(result: ObservationResult): Result<Level | null> {
  if (!validResult(result)) return fail('INVALID_INPUT','请如实选择参与状态和观察结果');
  // 产品假设：起点观察只建议支持方式，不按年龄推断能力。
  return ok(result.outcome===null ? null : result.outcome==='independent' ? 1 : 0);
}
