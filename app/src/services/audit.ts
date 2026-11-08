import type { AuditLog } from '../content/types';
// 日志由仓储提交固定码；不接收异常message、昵称、台词、备注或任意属性对象。
export function auditCode(code: AuditLog['event_code']): AuditLog['event_code'] { return code; }
