import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { HashRouter, Link, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { activities, contentVersion, findActivity, isMarket, makeGroup, modeNames, type Activity } from './catalog';
import { localDate, localWeek, retained, useProductStore } from './store';
import LearningPage from './LearningPage';
import { ParentDisclosure } from '../components/ParentDisclosure';
import { ErrorBoundary } from '../components/ErrorBoundary';
import Playway, { HomePlayways } from './HomePlayways';
import { HomeGuide } from './HomePreferences';
import './product.css';

const Legacy = import.meta.env.MODE !== 'market-free' && import.meta.env.MODE !== 'encrypted' && import.meta.env.MODE !== 'free' && import.meta.env.MODE !== 'release-prep' ? lazy(() => import('./LegacyBridge')) : null;
const Evening = import.meta.env.MODE !== 'market-free' && import.meta.env.MODE !== 'encrypted' && import.meta.env.MODE !== 'free' && import.meta.env.MODE !== 'release-prep' ? lazy(() => import('./LegacyEvening')) : null;
const Listening = lazy(() => import('./ListenCenter'));
const ListeningSchedules = lazy(() => import('./ListeningSchedules'));
const LicensedLearning = import.meta.env.MODE === 'release-prep' ? lazy(() => import('./LicensedLearning')) : null;
const ResourceCenter = import.meta.env.MODE === 'release-prep' ? lazy(() => import('../security/FormalResourceCenter')) : lazy(() => import('../security/ResourceCenter'));
const FormalCourseList = lazy(() => import('./FormalLearning').then(module => ({ default: module.FormalCourseListPage })));
const FormalCourseScene = lazy(() => import('./FormalLearning').then(module => ({ default: module.FormalCourseScenePage })));
const CourseAccess = import.meta.env.MODE === 'encrypted' ? lazy(() => import('../security/CourseAccess')) : null;
const ages = ['0至未满2岁', '2至未满3岁', '3至未满4岁', '4至未满6岁', '6至未满9岁', '9至未满12岁', '12至未满15岁', '15至未满18岁', '18至22岁'];
function Page({ title, children, hideTitle = false }: { title: string; children: ReactNode; hideTitle?: boolean }) { return <section><h1 className={hideTitle ? 'sr-only' : undefined} tabIndex={-1}>{title}</h1>{children}</section>; }
function Card({ activity }: { activity: Activity }) {
  return <Link className="product-card" to={`/learn/unit/${activity.id}`}><img src={activity.frames[0]?.image} alt={activity.title}/><div className="product-caption"><strong>{activity.title}</strong><span>1个活动</span></div></Link>;
}
function Modes({ activity, group = [activity.id] }: { activity: Activity; group?: string[] }) {
  const { pathname } = useLocation();
  return <div className="product-modes">{activity.modes.map(mode => <Link className="button-link" key={mode} state={{ returnTo: pathname }} to={`/learn/play/${activity.id}?mode=${mode}&group=${makeGroup(activity.id, group, mode).join(',')}`}>{modeNames[mode]}</Link>)}</div>;
}
function Home() {
  const prefs = useProductStore(state => state.data.prefs);
  if (!FormalCourseList) return <LegacyHome/>;
  return <Page title="首页" hideTitle><HomeGuide/><Suspense fallback={<p>读取课程内容…</p>}><FormalCourseList key={prefs.age} embedded/></Suspense></Page>;
}function LegacyHome() {
  const d = useProductStore(s => s.data), location = useLocation();
  const [guideOpen, setGuideOpen] = useState(() => { try { return localStorage.getItem('aienglish-first-guide-v1') !== 'done'; } catch { return true; } });
  const current = findActivity(d.selected) ?? activities[0];
  const resume = d.experiences.find(e => e.endedAt === null && e.version === contentVersion && e.group.every(id => !!findActivity(id)));
  return <Page title="一起学英语">
    {guideOpen && <section className="first-guide" aria-labelledby="first-guide-title"><div><span className="first-guide-kicker">第一次使用</span><h2 id="first-guide-title">三步开始一次轻松体验</h2><ol><li>选一张熟悉的图片。</li><li>点图片听一遍，也可以点句子前的喇叭重听。</li><li>陪孩子试一试，想结束时随时返回。</li></ol></div><button className="first-guide-dismiss" onClick={() => { try { localStorage.setItem('aienglish-first-guide-v1', 'done'); } catch { /* Keep the guide dismissible if storage is unavailable. */ } setGuideOpen(false); }}>开始体验</button></section>}
    {(location.state as { finished?: boolean } | null)?.finished && <p role="status" className="notice">本次体验已结束。体验进度与能力观察分开，不会自动打分。</p>}
    {!d.accepted && <p>先选一项内容试试，无需注册账号。</p>}
    {!isMarket && <div className="card formal-entry"><h2>首期正式课程</h2><p>按家庭、日常与幼儿园场景浏览30个课程主题，包含对话图片和点读词卡。</p><Link className="button-link primary" to="/courses">进入首期课程</Link></div>}
    {resume && <div className="card"><h2>继续上次</h2><p>{findActivity(resume.group[resume.unit] ?? '')?.title}</p><Link className="button-link primary" to={`/learn/play/${resume.group[0]}?mode=${resume.mode}&resume=${resume.id}`}>继续上次 · 第{resume.frame + 1}张</Link><p className="product-muted">恢复时静音，点图片再听。</p></div>}
    {current ? <><p className="product-muted">{resume ? '也可以换个方式' : '先试这一项'}</p><Card activity={current}/><Modes activity={current}/><Link to="/learn">换内容</Link></> : <EmptyContent/>}
    <div className="card"><h2>在生活中再试一次</h2><p>拿起玩偶、实物或图片，给孩子回应的时间。随时可以结束，不用学满时长。</p><Link to="/settings/weekly-goal">查看本周安排</Link></div>
    {Evening && <Suspense fallback={null}><Evening/></Suspense>}
  </Page>;
}
function EmptyContent() { return <div className="notice"><h2>暂时没有可发布的免费内容</h2><p>现有资源仍在审阅中。本版本没有将候选课程当作正式发布。</p><Link to="/settings/help">查看使用与版本说明</Link></div>; }
function Learn() {
  return <Suspense fallback={<p>读取玩法…</p>}><HomePlayways/></Suspense>;
}
function LegacyLearn() {
  const [query, setQuery] = useSearchParams(), prefs = useProductStore(s => s.data.prefs);
  const kind = query.get('track') === 'reading' ? 'reading' : 'speaking';
  const scope = query.get('scope') === 'all' ? 'all' : 'current';
  const search = query.get('q') ?? '';
  const list = activities.filter(a => a.kind === kind && a.title.includes(search));
  const setFilter = (key: string, value: string) => { const next = new URLSearchParams(query); next.set(key, value); setQuery(next, { replace: true }); };
  return <Page title="学习"><div className="row" aria-label="学习路径">{(['speaking', 'reading'] as const).filter(k => activities.some(a => a.kind === k)).map(k => <button key={k} aria-pressed={kind === k} onClick={() => setFilter('track', k)}>{k === 'speaking' ? '生活听说' : '文字与阅读'}</button>)}</div>
    <label>浏览范围<select value={scope} onChange={e => setFilter('scope', e.target.value)}><option value="current">当前起点</option><option value="all">全部可用</option></select></label>
    <p className="product-muted">兴趣年龄：{ages[Number(prefs.age.slice(1))] ?? '尚未选择'} · <Link to="/starting-point">调整起点</Link>。切换浏览范围不会修改起点。</p>
    {!isMarket && <p className="notice">这些是3–6岁内部候选，尚未标定多维难度，暂不按等级自动过滤或升级。其他年龄可浏览样例，尚无对应题材课程。</p>}
    {!isMarket && <div className="card formal-entry"><h2>首期正式课程</h2><p>30个主题场景，按家庭、日常生活和幼儿园分组。</p><Link className="button-link primary" to="/courses">浏览课程与图片</Link></div>}
    <form role="search" className="course-search" key={search} onSubmit={event => { event.preventDefault(); setFilter('q', String(new FormData(event.currentTarget).get('q') ?? '').trim()); }}><label htmlFor="legacy-course-query">找内容</label><div className="course-search-field"><input id="legacy-course-query" name="q" type="search" defaultValue={search} placeholder="按标题查找"/><button type="submit">搜索</button></div></form>
    {list.length ? <div className="product-grid">{list.map(a => <Card key={a.id} activity={a}/>)}</div> : activities.length ? <p role="status">当前范围没有匹配内容，请更换路径或清空搜索。</p> : <EmptyContent/>}
  </Page>;
}
function Detail() {
  const { unitId } = useParams(), d = useProductStore(s => s.data), a = findActivity(unitId ?? '');
  if (!a) return <Missing/>;
  return <Page title={a.title}><Link to="/learn">返回学习</Link><img className="product-hero" src={a.frames[0]?.image} alt={a.title}/><p>{a.goal}</p><p>准备：{a.materials}</p><Modes activity={a} group={makeGroup(a.id, d.group, 'child')}/>
    <Link to={`/learn/group?current=${a.id}`}>本次内容组 · 编辑顺序</Link>
    <ParentDisclosure title="换个玩法"><p>{a.kind === 'reading' ? '一起看图、指一指、用玩偶演故事。听懂故事不等于独立读字。' : a.offline}</p><p>玩法需保持本活动目标，改变任务时请选择对应内容。</p></ParentDisclosure>
    <ParentDisclosure title="看看这次怎么带"><p>{a.offline}</p><p>{a.boundary}</p></ParentDisclosure>
    <ParentDisclosure title="支持方式"><p>可以先示范、等一等、接受动作或中文参与。支持方式是建议，不必选择后才能开始。</p></ParentDisclosure>
    <ParentDisclosure title="本课材料与打印"><p>图帧：{a.frames.length}张。{a.kind === 'reading' ? '共读草稿，尚未定为自主阅读材料。' : '情境与示范语句。'}</p>{a.frames.map(f => <div key={f.id}>{f.lines.map(l => <p lang="en-US" key={l.id}>{l.text}</p>)}</div>)}<p>{a.boundary}</p><button onClick={() => window.print()}>打印活动说明</button></ParentDisclosure>
    {!isMarket && <button onClick={() => useProductStore.getState().select(a.id)}>设为首页内容</button>}
  </Page>;
}
function GroupEditor() {
  const [query] = useSearchParams(), d = useProductStore(s => s.data), navigate = useNavigate();
  const current = findActivity(query.get('current') ?? d.selected) ?? activities[0];
  const [ids, setIds] = useState(() => d.group.length ? d.group : current ? [current.id] : []);
  const [message, setMessage] = useState('');
  const change = (id: string, add: boolean) => { if (add && ids.length >= 5) { setMessage('本次最多选择5项活动。'); return; } setMessage(''); setIds(add ? [...ids, id] : ids.filter(x => x !== id)); };
  const move = (index: number, offset: number) => { const copy = [...ids]; const target = index + offset; if (!copy[index] || !copy[target]) return; [copy[index], copy[target]] = [copy[target]!, copy[index]!]; setIds(copy); };
  return <Page title="本次内容组"><p>选择并排列本次内容。只在这一组内接续，组尾停止，最多5项活动。</p><ol>{ids.map((id, i) => <li key={id}>{findActivity(id)?.title}<div className="row"><button disabled={i === 0} onClick={() => move(i, -1)}>上移</button><button disabled={i === ids.length - 1} onClick={() => move(i, 1)}>下移</button><button onClick={() => change(id, false)}>移除</button></div></li>)}</ol>
    <p>已选{ids.length}项，共{ids.reduce((n, id) => n + (findActivity(id)?.frames.length ?? 0), 0)}张图片；时长需以实际音轨为准。</p>
    {activities.map(a => <label key={a.id}><input type="checkbox" checked={ids.includes(a.id)} onChange={e => change(a.id, e.target.checked)}/>{a.title}</label>)}
    <p role="status">{message}</p><button className="primary" disabled={!ids.length} onClick={() => { if (useProductStore.getState().setGroup(ids)) navigate(`/learn/play/${ids[0]}?mode=child&group=${ids.join(',')}`); }}>保存并开始点读</button><p><Link to="/learn">取消并返回学习</Link></p>
  </Page>;
}
function Me() { return <Page title="我的" hideTitle><p>学习资料保存在这台设备，不需要账号。</p><h2>家长管理</h2><div className="product-menu"><Link to="/starting-point">听说与阅读起点</Link><Link to="/settings/weekly-goal">家长周目标</Link><Link to="/history/calendar">学习回顾</Link></div><h2>课程与设备</h2><div className="product-menu"><Link to="/settings/resources">课程资源与设备申请</Link>{CourseAccess && <Link to="/settings/course-access">课程授权</Link>}</div><h2>设置与帮助</h2><div className="product-menu"><Link to="/settings">设置</Link><Link to="/settings/help">家长帮助</Link><Link to="/about">关于与版本</Link></div></Page>; }
function StartingPoint() {
  const navigate = useNavigate(), prefs = useProductStore(s => s.data.prefs), [draft, setDraft] = useState(prefs), [saved, setSaved] = useState(false);
  const options = { listening: ['不确定，先体验', '熟悉现场词句', '能理解简短信息', '能跟随短故事'], speaking: ['不确定，先体验', '用熟悉词句回应', '简短来回交流', '几句连贯表达'], reading: ['不确定，先一起读', '看图和文字准备', '正在学字母音', '尝试自己读短句'] };
  return <Page title="听说与阅读起点"><p>由家长描述，不是标准化测评。听懂、表达和读字分开，不按播放次数升级。</p><form onSubmit={e => { e.preventDefault(); if (useProductStore.getState().preferences(draft)) navigate('/me'); }}>
    <label>兴趣年龄<select value={draft.age} onChange={e => { setDraft({ ...draft, age: e.target.value }); setSaved(false); }}>{ages.map((label, i) => <option key={i} value={`A${String(i).padStart(2, '0')}`}>{label}</option>)}</select></label>
    {(['listening', 'speaking', 'reading'] as const).map(key => <label key={key}>{{ listening: '听理解', speaking: '表达', reading: '文字与阅读' }[key]}<select value={draft[key]} onChange={e => { setDraft({ ...draft, [key]: e.target.value }); setSaved(false); }}>{options[key].map((label, i) => <option value={i === 0 ? 'unknown' : String(i)} key={i}>{label}</option>)}</select></label>)}
    <p>推荐依据是以上家长选择；现有候选材料尚未完成难度标注，不会自动评出RAZ、牛津或综合英语等级。</p><div className="row"><button className="primary">确认起点</button><Link to="/me">取消</Link></div>{saved && <p role="status">起点已保存在本机。</p>}</form>
  </Page>;
}
function WeeklyGoal() {
  const navigate = useNavigate();
  const goals = useProductStore(s => s.data.goals), [week, setWeek] = useState(localWeek()), [draft, setDraft] = useState<string | null>(null), [notice, setNotice] = useState('');
  const value = draft ?? goals.find(g => g.week === week && retained(g))?.text ?? '';
  return <Page title="家长周目标"><p>按周设置，不每天重复确认。最近一次保存起保留30天；旧目标时间不明时保留并标注。</p><label>选择这一周的任意一天<input type="date" value={week} onChange={e => { if (e.target.value) { setWeek(localWeek(new Date(`${e.target.value}T12:00:00`).getTime())); setDraft(null); setNotice(''); } }}/></label><p>本周从{week}（周一）开始。</p>
    <label>这周想一起尝试什么<textarea maxLength={300} value={value} onChange={e => { setDraft(e.target.value); setNotice(''); }}/></label><p>{value.length}/300字</p><div className="row"><button className="primary" disabled={!value.trim()} onClick={() => { if (useProductStore.getState().saveGoal(week, value)) { setDraft(null); navigate('/me'); } }}>确认周目标</button><button onClick={() => { setDraft(null); navigate('/me'); }}>取消</button></div><p role="status">{notice}</p>
    <h2>最近保存的周目标</h2>{goals.filter(g => retained(g)).sort((a, b) => b.week.localeCompare(a.week)).map(g => <article className="card" key={g.week}><h3>从{g.week}开始的一周</h3><p>{g.text}</p><p className="product-muted">{g.savedAt === null ? '旧记录保存时间未知，重新保存后按30天保留。' : `保留至${new Date(g.savedAt + 30 * 86400000).toLocaleString()}`}</p><button onClick={() => { if (window.confirm('删除这条周目标？不会删除体验或表现记录。')) useProductStore.getState().deleteGoal(g.week); }}>删除目标</button></article>)}
    {!goals.some(g => retained(g)) && <p>还没有保存的周目标。</p>}
  </Page>;
}
function Settings() {
  const p = useProductStore(s => s.data.prefs), store = useProductStore();
  return <Page title="设置"><h2>学习播放</h2><label><input type="checkbox" checked={p.auto} onChange={e => store.preferences({ auto: e.target.checked })}/>进入带着做、点读、跟读时自动播放一次</label><p>带着做、点读和自己读手动翻页，前两种方式翻页后自动播放；跟读会自动接续，点击“暂停”可暂停，点“继续”接续。</p><label>跟读停顿<select value={p.echoPause} onChange={e => store.preferences({ echoPause: e.target.value as typeof p.echoPause })}><option value="short">短</option><option value="standard">标准</option><option value="long">长</option></select></label><p>跟读不使用麦克风，不录音、不评分。</p><h2>每日记录</h2><label><input type="checkbox" checked={p.daily} onChange={e => store.preferences({ daily: e.target.checked })}/>展示晚间记录入口</label><label>设备当地展示时间<input type="time" value={p.recordTime} onChange={e => store.preferences({ recordTime: e.target.value })}/></label><p>默认20:00。只有真实有效观察任务才提供表现记录，点读/跟读不生成待评分任务。不会发送系统通知。</p><p><Link to="/me">返回我的</Link></p></Page>;
}
function History() {
  const d = useProductStore(s => s.data), [date, setDate] = useState(() => localDate());
  const list = d.experiences.filter(e => !date || e.localDate === date);
  return <Page title="学习回顾"><p>这里记录体验事实，不表示已经掌握。</p><label>查看某天<input type="date" value={date} onChange={e => setDate(e.target.value)}/></label><button onClick={() => setDate('')}>全部日期</button>
    {list.map(e => <article key={e.id} className="card"><h2>{findActivity(e.group[e.unit] ?? '')?.title ?? '旧版本内容'}</h2><p>{e.localDate} · {modeNames[e.mode]} · {e.endedAt ? e.reason === 'group_done' ? '本组播放结束' : '已结束体验' : '可继续'}</p><p className="product-muted">第{e.frame + 1}张 · {e.timezone}。没有据此生成能力成绩。</p>{!e.endedAt && e.version === contentVersion && <Link to={`/learn/play/${e.group[0]}?mode=${e.mode}&resume=${e.id}`}>继续上次</Link>}</article>)}
    {!list.length && <p>还没有这个范围的体验记录。</p>}<h2>家长表现记录</h2><p>候选练习尚未接入正式观察合同，不提供独立／帮助后／暂未打分入口。</p>{Legacy && <Link to="/records">查看旧版本的活动与观察记录</Link>}<p><Link to="/me">返回我的</Link></p>
  </Page>;
}
function DataPage() { return <Page title="本机数据"><p>偏好、周目标和体验位置保存在这台设备。清除网站或应用数据可能丢失。</p><Link to="/me">返回我的</Link></Page>; }
function Help() { return <Page title="家长帮助"><h2>如何开始</h2><p>首页可直接浏览免费场景，也可以调整起点。学习页展开大场景后进入小场景。带着做由家长引导；点读由孩子点击；跟读自动接续；自己读只在点击句子时发声。切换方式从首张开始，底部导航始终可用。</p><h2>没有声音怎么办</h2><p>检查设备音量并点喇叭重试。产品统一使用这台设备当前选定的本机英语声线；设备没有可用声线时会明确提示。听一听会按故事内容放慢语速并调整停顿和轻微语调。</p><h2>免费与付费交付</h2><p>{import.meta.env.MODE==='release-prep' ? (import.meta.env.VITE_GITHUB_RELEASE === '1' ? '本版内置30个免费场景，无需设备许可。后续开放的新增课程通过加密包和本机许可交付。' : '本地测试版保留原30免费场景。新增课程通过独立小级密文包与本机设备许可导入，授权后并入场景目录；请使用我的→课程资源与设备申请。') : CourseAccess ? '本版为独立加密验证版。请在我的→课程授权导出设备请求，由管理员核验权益后签发许可，再导入并下载课程。每个家长账号最多3个设备身份；已激活设备的课程无使用到期日。' : '本版没有付费解锁、兑换码或付费课程导入。付费资源独立交付；免费市场版不接受付费许可。'}</p><h2>家长说明</h2><p>支持方式只是文字建议，不需要选择才能开始。设备当地20:00可选记录，只针对真实可观察活动，不把点读或跟读当作能力成绩。</p><p><Link to="/me">返回我的</Link></p></Page>; }
function About() { if (import.meta.env.MODE === 'release-prep') return <Page title="关于与版本"><p>{import.meta.env.VITE_FORMAL_TRUST_PREVIEW === '1' ? 'AI LifeSay 0.95 · 正式身份联测' : import.meta.env.VITE_GITHUB_RELEASE === '1' ? 'AI LifeSay 0.96' : import.meta.env.VITE_ACCEPTANCE_VERSION_LABEL ? 'AI LifeSay ' + import.meta.env.VITE_ACCEPTANCE_VERSION_LABEL + ' · 本地签发联测' : import.meta.env.VITE_LOCAL_REVIEW === '1031' ? 'AI LifeSay 1.2.1105-update-v3（1109）· 11.05内容基线更新测试版' : 'AI LifeSay 1.0.0'}</p><p>运营：AI白泽 · 客服：aibaize@yeah.net</p><p>免费内容：原有 C01、C02、C03 共30个场景，无需密钥。{import.meta.env.VITE_GITHUB_RELEASE !== '1' && '当前为本地准备版本，公开发行签审尚未完成。'}</p><p>首期面向3–6岁；0–22岁是衔接规划。学习资料默认保存在本机，清除应用数据可能丢失。系统和设备组件的行为需要在目标设备验证。</p><p><Link to="/me">返回我的</Link></p></Page>; return <Page title="关于与版本"><p>产品代码 PD-1.0 · 内容版本{contentVersion}</p><p>{isMarket ? '免费体验构建：C01、C02无需密钥；当前为本地预览，公开发行签审仍待完成。' : '内部候选构建：教学、语言、视觉、音频及家庭验证分别待完成。'}</p><p>首期3–6岁；0–22岁是衔接规划，并非已经拥有全龄课程。学习资料默认本机，跟读不采集声音，不接广告、支付或第三方营销SDK。</p><p>离线网页资源是否保留取决于部署环境；当前浏览器版本不承诺锁屏连续播放或永久缓存。完整离线包和客户端能力需要目标设备验证。</p><p><Link to="/me">返回我的</Link></p></Page>; }
function Missing() { return <Page title="这份内容暂不可用"><p>可能是旧链接或内容版本变化。</p><Link to="/learn">返回学习</Link></Page>; }
function Compatibility() {
  if (Legacy) return <Suspense fallback={<p>读取旧版本资料…</p>}><Legacy/></Suspense>;
  return <Missing/>;
}
function Shell() {
  const location = useLocation(), ready = useProductStore(s => s.ready), error = useProductStore(s => s.error), blocked = useProductStore(s => s.blocked);
  const path = location.pathname;
  const activeTab = path === '/today' || path === '/' || (path.startsWith('/courses/') && new URLSearchParams(location.search).get('origin') === 'home') ? 'home' : path.startsWith('/play/') || /^\/(learn|courses|stories|scenes|activity|themes)/.test(path) ? 'learn' : path.startsWith('/listen') ? 'listen' : 'me';
  useEffect(() => { window.scrollTo(0, 0); document.querySelector<HTMLElement>('main h1')?.focus(); }, [location.pathname, location.search]);
  if (!ready) return <main><p>读取本机资料…</p></main>;
  return <><main className="product-main">
    {error && <div role="alert" className="product-error"><p>{error}</p>{blocked && <div className="row"><button onClick={() => useProductStore.getState().load()}>重新读取</button><button onClick={() => useProductStore.getState().exportData()}>导出原始备份</button></div>}</div>}
    {blocked ? <p>请保留备份后处理本机数据；当前已暂停写入。</p> : <Routes>
      <Route path="/" element={<Navigate to="/today" replace/>}/><Route path="/boot" element={<Navigate to="/today" replace/>}/><Route path="/welcome" element={<Navigate to="/today" replace/>}/>
      <Route path="/play/:playId" element={<Suspense fallback={<p>读取玩法…</p>}><Playway/></Suspense>}/><Route path="/today" element={<Home/>}/><Route path="/learn" element={<Learn/>}/><Route path="/explore" element={<Navigate to="/learn" replace/>}/>
      {FormalCourseList && <Route path="/courses" element={<Suspense fallback={<p>读取首期课程…</p>}><FormalCourseList/></Suspense>}/>}
      {FormalCourseScene && <Route path="/courses/:sceneId" element={<Suspense fallback={<p>读取场景课程…</p>}><FormalCourseScene/></Suspense>}/>}
      {LicensedLearning && <Route path="/licensed/:id" element={<Suspense fallback={<p>读取课程…</p>}><LicensedLearning/></Suspense>}/>}
      <Route path="/learn/unit/:unitId" element={<Detail/>}/><Route path="/learn/group" element={<GroupEditor/>}/><Route path="/learn/play/:unitId" element={<LearningPage/>}/><Route path="/stories/:storyId" element={<LearningPage/>}/>
      {CourseAccess && <Route path="/settings/course-access" element={<Suspense fallback={<p>读取授权…</p>}><CourseAccess/></Suspense>}/>}<Route path="/settings/resources" element={<Suspense fallback={<p>读取资源管理…</p>}><ResourceCenter/></Suspense>}/><Route path="/me" element={<Me/>}/><Route path="/starting-point" element={<StartingPoint/>}/><Route path="/settings/weekly-goal" element={<WeeklyGoal/>}/><Route path="/settings" element={<Settings/>}/><Route path="/settings/records" element={<Settings/>}/>
      <Route path="/settings/data" element={<DataPage/>}/><Route path="/settings/help" element={<Help/>}/><Route path="/about" element={<About/>}/><Route path="/history/calendar" element={<History/>}/><Route path="/daily-records" element={<Compatibility/>}/>
      <Route path="/resources" element={<Page title="本版本不提供课程导入"><p>付费课程独立交付，不在免费App内兑换或导入。</p><Link to="/learn">返回学习</Link></Page>}/>
      <Route path="/listen" element={Listening ? <Suspense fallback={<p>读取聆听内容…</p>}><Listening/></Suspense> : <Page title="听一听"><p>当前发行包没有可用的音频列表。</p><Link to="/learn">选择内容</Link></Page>}/>
      <Route path="/listen/schedules" element={<Suspense fallback={<p>读取定时熏听…</p>}><ListeningSchedules/></Suspense>}/>
      <Route path="*" element={<Compatibility/>}/>
    </Routes>}
    </main><nav className="product-nav" aria-label="主导航">{[{ id: 'home', to: '/today', label: '首页' }, { id: 'learn', to: '/learn', label: '学习' }, { id: 'listen', to: '/listen', label: '听一听' }, { id: 'me', to: '/me', label: '我的' }].map(tab => <Link key={tab.id} to={tab.to} className={activeTab === tab.id ? 'active' : ''} aria-current={activeTab === tab.id ? 'page' : undefined}>{tab.label}</Link>)}</nav></>;
}
export default function ProductApp() {
  useEffect(() => { useProductStore.getState().load(); const sync = (e: StorageEvent) => { if (e.key === 'aienglish-product-v1') useProductStore.getState().load(); }; window.addEventListener('storage', sync); return () => window.removeEventListener('storage', sync); }, []);
  useEffect(() => {
    const viewport = window.visualViewport;
    let fullHeight = viewport?.height ?? window.innerHeight;
    const update = () => {
      const active = document.activeElement;
      const editing = active instanceof HTMLTextAreaElement ||
        (active instanceof HTMLInputElement && !['checkbox','radio','file','button','submit','range','date','time'].includes(active.type)) ||
        (active instanceof HTMLElement && active.isContentEditable);
      const height = viewport?.height ?? window.innerHeight;
      if (!editing) fullHeight = height;
      document.body.classList.toggle('keyboard-open', editing && fullHeight - height > 120);
    };
    const orientation = () => { fullHeight = viewport?.height ?? window.innerHeight; update(); };
    const focusOut = () => { window.setTimeout(update,0); };
    document.addEventListener('focusin',update);
    document.addEventListener('focusout',focusOut);
    viewport?.addEventListener('resize',update);
    window.addEventListener('resize',update);
    window.addEventListener('orientationchange',orientation);
    return () => {
      document.removeEventListener('focusin',update);
      document.removeEventListener('focusout',focusOut);
      viewport?.removeEventListener('resize',update);
      window.removeEventListener('resize',update);
      window.removeEventListener('orientationchange',orientation);
      document.body.classList.remove('keyboard-open');
    };
  }, []);
  return <ErrorBoundary><HashRouter><Shell/></HashRouter></ErrorBoundary>;
}



