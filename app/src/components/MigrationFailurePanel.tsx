import { MIGRATION_FAILURE_NOTICE } from '../db/migrations';

// C-10/G-4：升级失败专用提示。
// 复用 MIGRATION_FAILURE_NOTICE；不落成普通 STORAGE_ERROR，也不建议清库。
// 旧数据保留，提示关闭其他窗口后重试。
export function MigrationFailurePanel() {
  return (
    <section className="card" role="alert" aria-label="升级未完成">
      <h2>升级未完成</h2>
      <p>{MIGRATION_FAILURE_NOTICE}</p>
      <p className="notice">
        已安装版本低于当前数据版本时会出现此提示；请勿清除浏览器数据，也勿降版本强开数据库。
      </p>
    </section>
  );
}
