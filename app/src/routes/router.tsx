import { useEffect, lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { RequireReady } from './guards';
import { useAppStore } from '../stores/appStore';
import { WeeklyGoalScreen, RecordPreferencesScreen, DailyRecordsScreen } from '../pages/parent-screens';
import { ExplorePage, UnitPage, ActivityPage as PilotActivityPage, StoryPage } from '../pages/PilotLearningPage';
import BootPage from '../pages/BootPage';
import WelcomePage from '../pages/WelcomePage';
import EntryPage from '../pages/EntryPage';
import SetupPage from '../pages/SetupPage';
import StartingPointPage from '../pages/StartingPointPage';
import TodayPage from '../pages/TodayPage';
import ThemesPage from '../pages/ThemesPage';
import ThemeDetailPage from '../pages/ThemeDetailPage';
import SceneTeachingPage from '../pages/SceneTeachingPage';
import SceneGalleryPage from '../pages/SceneGalleryPage';
import WordGalleryPage from '../pages/WordGalleryPage';
import GameModeGalleryPage from '../pages/GameModeGalleryPage';
import SceneTaxonomyPage from '../pages/SceneTaxonomyPage';
const ScenePackGalleryPage=lazy(()=>import('../pages/ScenePackGalleryPage'));
import LessonBriefPage from '../pages/LessonBriefPage';
import ResourceImportPage from '../pages/ResourceImportPage';
import PlaybackPage from '../pages/PlaybackPage';
import PermissionCenterPage from '../pages/PermissionCenterPage';
import ObservationPage from '../pages/ObservationPage';
import GoalSelectionPage from '../pages/GoalSelectionPage';
import PreparePage from '../pages/PreparePage';
import ActivityPage from '../pages/ActivityPage';
import RecordPage from '../pages/RecordPage';
import ReviewPage from '../pages/ReviewPage';
import DayResultPage from '../pages/DayResultPage';
import CalendarPage from '../pages/CalendarPage';
import PeriodPage from '../pages/PeriodPage';
import NextStepPage from '../pages/NextStepPage';
import RecordsPage from '../pages/RecordsPage';
import RecordDetailPage from '../pages/RecordDetailPage';
import ReportsPage from '../pages/ReportsPage';
import ReportsHistoryPage from '../pages/ReportsHistoryPage';
import ReportDetailPage from '../pages/ReportDetailPage';
import SettingsPage from '../pages/SettingsPage';
import ProfileSettingsPage from '../pages/ProfileSettingsPage';
import VoiceSettingsPage from '../pages/VoiceSettingsPage';
import PrivacySettingsPage from '../pages/PrivacySettingsPage';
import DataSettingsPage from '../pages/DataSettingsPage';
import HelpPage from '../pages/HelpPage';
import AboutPage from '../pages/AboutPage';
import NotFoundPage from '../pages/NotFoundPage';

// V1 已注册路由（A 组）。作为路由可达性测试的唯一路径清单来源。
export const V1_ROUTE_PATHS = [
  '/',
  '/boot',
  '/welcome',
  '/entry',
  '/setup',
  '/starting-point',
  '/today',
  '/explore',
  '/learn/unit/:unitId',
  '/learn/play/:unitId',
  '/stories/:storyId',
  '/themes',
  '/themes/:themeId',
  '/scenes/:themeId',
  '/scenes',
  '/words',
  '/modes',
  '/scenes/taxonomy',
  '/scenes/packs',
  '/lessons/:themeId',
  '/resources',
  '/settings/playback',
  '/settings/permissions',
  '/observations/new',
  '/goals/select',
  '/next-step/:recordId',
  '/records',
  '/records/:recordId',
  '/reports',
  '/reports/history',
  '/reports/:weekStart',
  '/activity/prepare',
  '/activity/:sessionId',
  '/activity/:sessionId/record',
  '/activity/:sessionId/review',
  '/results/:date',
  '/history/calendar',
  '/history/period/:granularity/:periodKey',
  '/settings',
  '/settings/profile',
  '/settings/weekly-goal',
  '/settings/records',
  '/daily-records',
  '/settings/voice',
  '/settings/privacy',
  '/settings/data',
  '/settings/help',
  // P2 · B2c 体系说明页：纯静态、零外发请求，URL 直达可分享。
  '/about'
] as const;

// A-7：V1.5 预留，**V1 不注册**（仅注释占位）。
// - `#/plans`            → P25 增强计划（多日计划模型，V1.5）
// - `#/review`           → P26 再次练习（重复学习队列，V1.5）
// - `#/settings/account` → P27 家长账号候选（阶段 B，V1 不展示登录控件）
// 未注册时上述地址落到 NotFoundPage，不展示登录/计划控件、不建表、不接权限。
export const V1_RESERVED_V15_PATHS = [
  '/plans',
  '/review',
  '/settings/account'
] as const;

// 路由表本体：不绑定 Router 实现，便于在测试中以 MemoryRouter 挂载。
export function AppRoutes() {
  return (
    <Routes>
            <Route path="/" element={<Navigate to="/boot" replace />} />
            <Route path="/boot" element={<BootPage />} />
            <Route path="/welcome" element={<WelcomePage />} />
            {/* P19 选择进入方式：本机开始 / 只读示例（无需账号） */}
            <Route path="/entry" element={<EntryPage />} />
            <Route path="/setup" element={<SetupPage />} />
            {/* P20 建议学习起点：候选 E + 依据 + 待验证标识 */}
            <Route path="/starting-point" element={<StartingPointPage />} />
            <Route path="/today" element={<RequireReady><TodayPage /></RequireReady>} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/learn/unit/:unitId" element={<UnitPage />} />
            <Route path="/learn/play/:unitId" element={<PilotActivityPage />} />
            <Route path="/stories/:storyId" element={<StoryPage />} />
            <Route path="/themes" element={<ThemesPage />} />
            <Route path="/themes/:themeId" element={<ThemeDetailPage />} />
            {/* V1.5-B1 场景图片教学：自制原创场景图 + 已标注热点点击朗读 */}
            <Route path="/scenes" element={<SceneGalleryPage />} />
            {/* 批次2-C3 场景库分级（域→类→场景）：对齐 09 归类体系 */}
            <Route path="/scenes/taxonomy" element={<SceneTaxonomyPage />} />
            {/* 2026-10-11 场景课程库：27 个内容包收编视图（C01/C02/C03） */}
            <Route path="/scenes/packs" element={<Suspense fallback={<p role="status">正在打开生活场景…</p>}><ScenePackGalleryPage /></Suspense>} />
            <Route path="/scenes/:themeId" element={<SceneTeachingPage />} />
            {/* 批次2 单词卡图库：每个单词都有自制原创配图 */}
            <Route path="/words" element={<WordGalleryPage />} />
            {/* 批次3 玩法一览：课内玩法变体（点听／听音指认／动作律动），不静默增第三课 */}
            <Route path="/modes" element={<GameModeGalleryPage />} />
            {/* V1.5-B2 课程讲解：目标／怎么做／观察什么，不强制看 */}
            <Route path="/lessons/:themeId" element={<LessonBriefPage />} />
            {/* V1.5-B4 资源导入：权利状态先于正文，unknown 只建卡零正文 */}
            <Route path="/resources" element={<ResourceImportPage />} />
            {/* V1.5-B5 播放进度／书签：与学习表现分开存储 */}
            <Route path="/settings/playback" element={<PlaybackPage />} />
            {/* V1.5-B6 隐私与权限中心（F30）+ 离线（F27）：本应用不索取敏感权限 */}
            <Route path="/settings/permissions" element={<PermissionCenterPage />} />
            <Route path="/observations/new" element={<ObservationPage />} />
            <Route path="/goals/select" element={<GoalSelectionPage />} />
            <Route path="/next-step/:recordId" element={<NextStepPage />} />
            <Route path="/records" element={<RecordsPage />} />
            <Route path="/records/:recordId" element={<RecordDetailPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/reports/history" element={<ReportsHistoryPage />} />
            <Route path="/reports/:weekStart" element={<ReportDetailPage />} />
            <Route path="/activity/prepare" element={<PreparePage />} />
            <Route path="/activity/:sessionId" element={<ActivityPage />} />
            <Route path="/activity/:sessionId/record" element={<RecordPage />} />
            {/* P21 可选评估：默认不勾「合适」，可跳过；跳过不写值 */}
            <Route path="/activity/:sessionId/review" element={<ReviewPage />} />
            {/* P22 当天学习情况：活动事实与观察结果分区，无积分 */}
            <Route path="/results/:date" element={<DayResultPage />} />
            {/* P23 学习日历：有记录/待补记/无记录/读取失败四态分开，无连胜链 */}
            <Route path="/history/calendar" element={<CalendarPage />} />
            {/* P24 月/年：白名单 month|year，显示实际覆盖区间 */}
            <Route path="/history/period/:granularity/:periodKey" element={<PeriodPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/weekly-goal" element={<WeeklyGoalScreen/>}/><Route path="/settings/records" element={<RecordPreferencesScreen/>}/><Route path="/daily-records" element={<DailyRecordsScreen/>}/><Route path="/settings/profile" element={<ProfileSettingsPage />} />
            <Route path="/settings/voice" element={<VoiceSettingsPage />} />
            <Route path="/settings/privacy" element={<PrivacySettingsPage />} />
            <Route path="/settings/data" element={<DataSettingsPage />} />
            <Route path="/settings/help" element={<HelpPage />} />
            {/* P2 · B2c 体系说明页：理念透明化说明文，非教学效果承诺；纯静态可分享 */}
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

// HashRouter：路由状态位于 hash，不发送给静态服务器，也不写入姓名或正文。
// 启动即读取本机数据（bootstrap）；升级失败等错误会落成专用提示，
// 而不是把读取失败静默当成空数据。
export function AppRouter() {
  useEffect(() => {
    void useAppStore.getState().boot();
  }, []);
  return (
    <ErrorBoundary>
      <HashRouter>
        <AppShell>
          <AppRoutes />
        </AppShell>
      </HashRouter>
    </ErrorBoundary>
  );
}
