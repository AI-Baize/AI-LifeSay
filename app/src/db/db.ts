import { AppDatabase } from './schema';
// 每个仓储操作拥有独立连接，finally只关闭自己的连接，避免并发操作互相中断。
export const connection = { open: (name?: string) => new AppDatabase(name) };
export const db = new AppDatabase();
export function closeDatabase(): void { db.close(); }
