// V1.5-B2：课程讲解页（F08）。
//
// 独立讲解入口，展示「目标／怎么做／观察什么」；不强制看讲解才可活动。
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { readCatalog } from '../content/catalog';
import { Screen } from './shared';
import { EmptyState } from '../components/EmptyState';
import { LessonBriefPanel } from '../components/LessonBriefPanel';

export function LessonBriefScreen() {
  const { themeId } = useParams();
  const [query]=useSearchParams();
  const taskId=query.get('task');
  const catalog = readCatalog();
  const theme = catalog.ok && themeId ? catalog.data.find(t => t.id === themeId) ?? null : null;

  return (
    <Screen title="课程讲解（V1.5）">
      {!theme ? (
        <EmptyState message="没有找到这个主题的讲解；不会用别的主题冒充。" />
      ) : (
        <>
          <p>{theme.title_zh}</p>
          <LessonBriefPanel themeId={theme.id} taskId={taskId??undefined} />
          <p>
            <Link to={"/goals/select?theme="+theme.id+(taskId?"&task="+encodeURIComponent(taskId):"")}>不看讲解，直接开始这次活动</Link>
          </p>
          <p>
            <Link to={`/themes/${theme.id}`}>回到主题</Link>
          </p>
        </>
      )}
    </Screen>
  );
}

export default LessonBriefScreen;
