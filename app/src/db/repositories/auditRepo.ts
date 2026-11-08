import type { AppDatabase } from '../schema';
export const auditRepo = {
 // 仅在仓储管理的连接与事务中读取；页面不能绕过统一写入流水线。
 read(db: AppDatabase) { return db.auditLog.toArray(); }
};
