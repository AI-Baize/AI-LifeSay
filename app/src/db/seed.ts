import { repository } from './repository';
import type { WriteCommand } from './contracts';
// 只响应家长的显式操作；所有行必须为demo，统一仓储负责幂等，不在启动时重置。
export async function seedDemo(command: WriteCommand) {
 return repository.write(command);
}
