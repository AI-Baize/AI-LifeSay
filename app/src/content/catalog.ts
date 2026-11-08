import family from './themes/family-greetings.json';
import colors from './themes/colors-shapes.json';
import kindergarten from './themes/kindergarten.json';
import animals from './themes/animals-actions.json';
import { validateTheme } from './validate';
import { ok, type Result, type Theme } from './types';
export function readCatalog(): Result<readonly Theme[]> {
  const themes: Theme[] = [];
  // 主题序列：家庭 → 颜色 → 幼儿园（C03 三场景迁移收编）→ 动物。
  for (const raw of [family, colors, kindergarten, animals]) {
    const result = validateTheme(raw);
    if (!result.ok) return result;
    themes.push(result.data);
  }
  return ok(Object.freeze(themes));
}
