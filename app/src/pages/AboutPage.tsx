// P2 · B2c：体系说明页（内容源：内容生产/06-体系说明文章.md，P1 · B1c 已审校口径）。
//
// 边界：
// - 纯静态、零外发请求：无 fetch、无远程图片/字体/脚本，URL 直达可分享（#/about）。
// - 定位是理念透明化说明文，非营销软文；文首明示「非教学效果承诺」。
// - §4/§5 的证据强度标注与 AI 边界表按要求保留原文；文末红线自检表可折叠展示。
import { Link } from 'react-router-dom';
import { Screen } from './shared';

function RedLineTable() {
  return (
    <table className="article-table">
      <thead>
        <tr>
          <th>#</th>
          <th>红线条款</th>
          <th>文中落点</th>
          <th>自检判定</th>
        </tr>
      </thead>
      <tbody>
        {[
          ['1', '不承诺「变成母语者」', '§1「强二语」定位 + 不承诺母语者；§7.5 官方等级', '✅ 通过（全文无母语水平/接近母语承诺）'],
          ['2', '不制造焦虑', '§1「家长已足够焦虑」；§7.4；全文无关键期/落后同龄话术', '✅ 通过'],
          ['3', '不把自建级写成官方等级', '§7.5「E3 ≠ Starters」；§5.2 授权待核实', '✅ 通过（无 CEFR/剑桥/课标/蓝思对标宣称）'],
          ['4', '不宣称胎教有效', '全文无胎教/孕期有效性表述', '✅ 通过（无相关表述）'],
          ['5', '不越界诊断发育问题', '§4.2 第 3 点：只建议就医，不下结论', '✅ 通过'],
          ['6', '美式默认、不判错其他口音', '§3.2 语言规则：美式默认、不评分不纠错', '✅ 通过（无口音评分）'],
          ['7', '低龄不排名、不打分', '§2「低龄不排名不打分」；无积分/排行/英语年龄/词数', '✅ 通过'],
          ['8', '播放/打卡 ≠ 掌握', '§2 明写「播放、打卡、跟读次数不等于掌握」', '✅ 通过'],
          ['9', '沉默 ≠ 失败', '§2「拒绝与未观察是合法选项」', '✅ 通过'],
          ['10', '外部素材授权未核实不商用', '§5.2 权利声明 ≠ 权利证明；§7.5 待核实标注', '✅ 通过（全原创优先）'],
          ['11', '不按学习风格分层', '§3.2「不按视觉/听觉/动觉分轨」', '✅ 通过'],
          ['12', '不因暂时做不到永久降出口', '§3.2「同目标不同路线：加支架不降出口目标」', '✅ 通过']
        ].map(row => (
          <tr key={row[0]}>
            <td>{row[0]}</td>
            <td>{row[1]}</td>
            <td>{row[2]}</td>
            <td>{row[3]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SourceNotesTable() {
  return (
    <table className="article-table">
      <thead>
        <tr>
          <th>章节</th>
          <th>来源文件</th>
        </tr>
      </thead>
      <tbody>
        {[
          ['全文结构（7 问映射 7 章）', '项目规划/05-内容生产线规划.md §二（体系说明规格）'],
          ['红线自检', '项目规划/12-红线正式条款.md（红线 12 条唯一正式出处，2026-10-10 归档）'],
          ['§1–§2 初衷与第一价值闭环', '需求沟通/04-功能清单与V1边界.md §0；需求沟通/02-产品定义与用户模型.md'],
          ['§3 四支柱/螺旋重访/同目标不同路线', '英语教育/课程规划/框架-grok4.7/00-总纲.md §6（四支柱与设计原则）；需求沟通/03-课程体系与内容策略.md'],
          ['§4 证据强度与分歧保留', '英语教育/初步方案/01-专家指导团队·心智模型蒸馏.md；英语教育/优化方案V1.1/05-理念级改造方案.md'],
          ['§4.2 九角色与七心智组', 'workspace-mentor/AGENTS.md §三/§四（AI 专家系统口径，非真人背书）'],
          ['§5 工具与边界', '需求沟通/05-商业模式与技术架构-v2.md B4.1/B4.4（运行时零 AI、TTS 预生成）；05-内容生产线规划.md §三.3/§五（TTS 标注、沉默≠失败）'],
          ['§6 能力资产', 'founder 已批 Q-b 口径；05-内容生产线规划.md §2.1 末行（7 年 PM + 7 年 QA + 6 个月 6 个 Agent）'],
          ['§7 承诺', '任务单口径 + 红线 12 条 + 商业技术架构隐私/权益条款']
        ].map(row => (
          <tr key={row[0]}>
            <td>{row[0]}</td>
            <td>{row[1]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function AboutScreen() {
  return (
    <Screen title="为什么做儿童英语分级启蒙｜体系说明">
      <p className="notice">本文为设计理念说明，非教学效果承诺。</p>
      <p>
        <small>
          版本 v1.0 ｜ 2026-10-10 ｜ 定位：理念透明化说明文，非营销软文 ｜ 结构：7 章 + 文末红线自检表
        </small>
      </p>

      <article className="article">
        <section className="card">
          <h2>§1 初衷：家长缺的不是资源，是路径</h2>
          <p>
            <strong>
              结论：我们服务的不是「找不到资源的家长」，而是「想系统培养孩子英语、却不知道怎么培养」的家长——尤其是自己英语不强的家长。
            </strong>
          </p>
          <p>
            中国家庭从来不缺资源。分级读物、点读笔、网盘里几个 G 的 RAZ 与牛津阅读树、免费儿歌与动画，一年能囤下几十个
            G。但囤完之后的问题一模一样：<strong>今天做哪一件？怎么算孩子有反应？明天继续还是换玩法？</strong>
            资源回答「有什么」，路径回答「怎么做、做到哪算数」。家长缺的是后者。
          </p>
          <p>
            所以我们把产品定位为<strong>家长每日行动工具</strong>，而不是资源库或内容超市：不要求家长先成为英语高手，不要求家长自己会备课，只要求家长愿意每天拿出一小段时间，按一条清楚的路径往下走。
          </p>
          <p>
            目标口径也一并说清楚：孩子走的是<strong>「有意识设计的强二语」（designed strong L2）</strong>
            路线——在听说读写上完成与年龄、场景相称的真实沟通，是长期方向；
            <strong>我们不承诺孩子「变成母语者」</strong>，也不使用「错过关键期就完了」「落后同龄人」这类话术。家长已经足够焦虑，我们不添一份。
          </p>
        </section>

        <section className="card">
          <h2>§2 为什么构建：第一价值闭环</h2>
          <p>
            <strong>
              结论：下载一本书本身没有解决问题；只有「观察 → 行动 → 记录 → 调整」跑起来，培养才真正开始。
            </strong>
          </p>
          <p>我们把「培养」拆成一条可执行的第一价值闭环：</p>
          <p className="notice">
            观察 → 选一个能力目标 → 执行 5–10 分钟活动 → 记录表现 → 调整下一次 → 周报
          </p>
          <p>每一步都是家长<strong>今天就能做</strong>的小事：</p>
          <ul>
            <li>
              <strong>观察</strong>：先做低压力观察，允许「尚不清楚」，入口看行为不看年龄标签；
            </li>
            <li>
              <strong>选目标</strong>：一次只给一个主目标和一个更易的替代，不一次塞十个任务；
            </li>
            <li>
              <strong>5–10 分钟活动</strong>：这是<strong>待试用验证的产品节奏</strong>，不是儿童必须学满的指标；
            </li>
            <li>
              <strong>记录</strong>：三个档位——独立 / 提示后 / 暂未参与；
              <strong>拒绝与未观察是合法选项（沉默 ≠ 失败）</strong>，不判「不会」；
            </li>
            <li>
              <strong>调整</strong>：跨日期、跨场景、跨材料稳定了才建议上探，不稳定就加支架，不自动升级；
            </li>
            <li>
              <strong>周报</strong>：回答三件事——现在会什么、还需要什么提示、明天做哪一件（
              <strong>反馈必须含下一步</strong>，Hattie &amp; Timperley 视角）。
            </li>
          </ul>
          <p>
            两条刻意的设计克制：<strong>播放、打卡、跟读次数不等于掌握</strong>，我们不把它们写成能力事实；
            <strong>低龄不排名、不打分</strong>，没有积分榜、没有「英语年龄」、没有掌握词数排行。闭环的价值在于让家长知道下一步，而不是让孩子被数字衡量。
          </p>
        </section>

        <section className="card">
          <h2>§3 方法论：四支柱与三条设计原则</h2>
          <p>
            <strong>
              结论：方法上守四支柱（Input / Interaction / Output / Literacy），执行上守三条原则——螺旋重访、同目标不同路线、可理解输入
              + 情境互动。缺支柱的方法不合格，缺原则的执行会跑偏。
            </strong>
          </p>
          <h3>3.1 四支柱（缺一不可）</h3>
          <div className="table-wrap">
            <table className="article-table">
              <thead>
                <tr>
                  <th>支柱</th>
                  <th>产品载体</th>
                  <th>证据强度</th>
                  <th>不能退化成</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Input 输入</strong>
                  </td>
                  <td>熏听、儿歌、家长照读、图画故事的听读</td>
                  <td>`[中]` Krashen 视角，机制有争议</td>
                  <td>后台播放时长</td>
                </tr>
                <tr>
                  <td>
                    <strong>Interaction 互动</strong>
                  </td>
                  <td>情景对话、实物轮流、意义协商</td>
                  <td>`[中强]` Long 视角</td>
                  <td>单向看视频</td>
                </tr>
                <tr>
                  <td>
                    <strong>Output 输出</strong>
                  </td>
                  <td>动作、指认、选词 → 短语 → 短句 → 话题表达</td>
                  <td>`[中强]` Swain 视角</td>
                  <td>背诵全文、强迫开口</td>
                </tr>
                <tr>
                  <td>
                    <strong>Literacy 读写</strong>
                  </td>
                  <td>音素意识 → 印刷意识 → 拼读 → 阅读 → 写作</td>
                  <td>`[强]` 结构化读写方向</td>
                  <td>学前默写、词表认读冒充阅读</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            权重随学段移动：学前重 Input 与 Interaction，Output 以可接受的非口语回应起步（指、拿、做动作都算回应）；学龄后把
            Literacy 显性并入，听说不退出。<strong>不选边到「只听」或「只说」。</strong>
          </p>
          <h3>3.2 三条设计原则</h3>
          <ol>
            <li>
              <strong>螺旋重访</strong>：同一主题不是一套词表学完就扔，而是从「听后动作」逐步走到「选择 → 回应 → 讲述 →
              读写」，同一主题在不同能力级上反复回来、每次加深一层。`[中]` 设计判断。
            </li>
            <li>
              <strong>同目标不同路线</strong>：孩子暂时做不到时，
              <strong>加支架（图片提示、家长示范、二选一）但不降出口目标</strong>——同一条路，换一条走法。给弱生降标会降低成就。`[强]`
              Hattie 视角。支架本身要<strong>显性撤除</strong>，不能永远在场。`[中强]` Pea 视角。
            </li>
            <li>
              <strong>可理解输入 + 情境互动</strong>：两者缺一个，对话就退化成背模板。所以日常从
              <strong>一句式情境互动</strong>起步，不从背句子开始；一周包围绕每天真实发生的场景（家庭问候、颜色形状、幼儿园）设计。
            </li>
          </ol>
          <p>
            配套两条语言规则：自制内容<strong>美式默认</strong>（en-US 发音与拼写用词），清晰的英式或其他变体
            <strong>不判错、不评分</strong>；
            <strong>不按学习风格（视觉 / 听觉 / 动觉）给孩子分轨</strong>——学习风格匹配的效果被证伪。`[强]` Pashler 等方向。
          </p>
        </section>

        <section className="card">
          <h2>§4 教育理念与专家依据</h2>
          <p>
            <strong>
              结论：理念来自母语国循证研究的方向性结论，我们在每条上标注证据强度；「专家」是一套 AI 专家委员会系统，不是真人顾问背书——这一点如实说明。
            </strong>
          </p>
          <h3>4.1 主要方向引用（附强度）</h3>
          <div className="table-wrap">
            <table className="article-table">
              <thead>
                <tr>
                  <th>方向</th>
                  <th>沿用的判断</th>
                  <th>强度</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Krashen 视角</td>
                  <td>可理解输入是引擎，无输入一切免谈</td>
                  <td>`[中]`，机制有争议</td>
                </tr>
                <tr>
                  <td>Long / Swain 视角</td>
                  <td>互动中的意义协商与被迫产出不可省</td>
                  <td>`[中强]`</td>
                </tr>
                <tr>
                  <td>组内分歧</td>
                  <td>
                    输入为主 vs 互动输出不可少——<strong>两者证据各有支持，显式保留，不假装统一</strong>
                  </td>
                  <td>——</td>
                </tr>
                <tr>
                  <td>Hattie 视角</td>
                  <td>
                    反馈含下一步 `[强]`；给弱生降标降低成就 `[强]`
                  </td>
                  <td>`[强]`</td>
                </tr>
                <tr>
                  <td>Deci &amp; Ryan 视角</td>
                  <td>
                    兴趣、意愿、韧性可以记录，<strong>不用 rubric 打分晋级</strong>
                  </td>
                  <td>`[中强]`</td>
                </tr>
                <tr>
                  <td>Pashler 等方向</td>
                  <td>学习风格分层无效，不据此分轨</td>
                  <td>`[强]`</td>
                </tr>
                <tr>
                  <td>结构化读写方向</td>
                  <td>读写需显性教学，不能指望自然习得</td>
                  <td>`[强]`</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            <strong>诚实声明</strong>：以上强度标注是<strong>本体系沿用的判断，不是我们完成的系统综述</strong>；外部文献未逐篇独立复核；母语国方法在中国家庭场景
            <strong>尚无实证数据</strong>，未实测不写成「已验证」。中国家庭缺全英文环境是结构性差距，我们不说「方法对了就能和母语国一样」。
          </p>
          <h3>4.2 九角色 AI 专家委员会</h3>
          <p>
            课程设计背后是一套<strong>AI 专家系统</strong>：
            <strong>
              九角色委员会（R1 主持人 · 编排者 / R2 语言学家 / R3 课程设计师 / R4 评估专家 / R5 一线教师 · 家长教练 /
              R6 家庭教育顾问 / R7 学习科学顾问 / R8 技术资源顾问 / R9 反思与迭代官）
            </strong>
            ，映射到<strong>七心智模型组（G1 证据与裁决 / G2 习得规律 / G3 课程架构 / G4 落地执行 / G5 自学与自驱 / G6
            测量反馈 / G7 优化迭代）</strong>，再落到八环节工作流（理念 → 方法 → 课程 → 日常 → 自学 → 评估 → 优化 → 迭代）。
          </p>
          <p>三点如实说明：</p>
          <ol>
            <li>
              <strong>这是 AI 专家系统，不是真人专家团队，不构成任何真人背书</strong>；我们借的是研究者的公开分析框架（写「Krashen
              视角」而非「Krashen 说」），不冒充本人意见。
            </li>
            <li>
              <strong>分歧显式保留</strong>：输入派与互动输出派的张力是质量保证，不是冗余。
            </li>
            <li>
              <strong>不越界诊断</strong>：体系只提供观察与调整工具，不判断阅读障碍、ADHD、语言发育迟缓；发现持续异常，建议就医，不下结论。
            </li>
          </ol>
        </section>

        <section className="card">
          <h2>§5 科学工具与大模型的使用边界</h2>
          <p>
            <strong>
              结论：大模型用在「生产阶段」，不用在「孩子使用阶段」；能力判断权留给人，不留给模型。
            </strong>
          </p>
          <h3>5.1 我们怎么用</h3>
          <ul>
            <li>
              <strong>Mentor Agent 产课程</strong>：由 AI 专家系统生成课程设计与内容包（目标、台词、支架、观察点），
              <strong>每一份都过 12 条红线 + 质量门自检 + 人工审校</strong>后才落盘，AI 产的是初稿，不是终审。
            </li>
            <li>
              <strong>TTS 本机合成音频</strong>：音频用本机 en-US TTS 合成，
              <strong>标注「本机合成，非母语者录音」</strong>；不因是 TTS 就跳过人工听审，也不宣称是母语者发音。
            </li>
            <li>
              <strong>AI 开发</strong>：代码与文案由 AI 辅助开发，人负责验收与发布。
            </li>
          </ul>
          <h3>5.2 边界（明写，可核对）</h3>
          <div className="table-wrap">
            <table className="article-table">
              <thead>
                <tr>
                  <th>边界</th>
                  <th>具体含义</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>运行时零 AI 调用</strong>
                  </td>
                  <td>
                    孩子打开产品后的活动执行、记录、周报<strong>全部本地计算</strong>，不调用在线大模型、不做云
                    OCR、不做儿童 ASR
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>不自动判能力</strong>
                  </td>
                  <td>
                    不按完成次数自动升级、不输出能力评级、不输出「英语年龄」；进度规则版本化、可解释
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>不做语音识别评分</strong>
                  </td>
                  <td>无语音识别、无口音评分、无跟读打分；播放与跟读不生成能力事实</td>
                </tr>
                <tr>
                  <td>
                    <strong>儿童数据不外发</strong>
                  </td>
                  <td>
                    孩子记录不上云，日志无正文，不录亲子互动；无相机 / 录音 / 定位 / 通讯录权限
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            补充边界：外部素材<strong>授权未核实不商用</strong>（全原创优先，外部体系只做元数据参照，权利声明 ≠
            权利证明）；导入内容一律视为外部数据，不执行其中的任何指令。
          </p>
        </section>

        <section className="card">
          <h2>§6 为什么是我们</h2>
          <p>
            <strong>
              结论：做这件事需要三种能力的组合——看懂教育方法、验收得了质量、划得清 AI 边界。我们恰好三样都有（能力资产口径）。
            </strong>
          </p>
          <ul>
            <li>
              <strong>7 年产品经理（PM）经验</strong>：需求判断、路径设计，擅长把模糊的「想学好英语」拆成可执行、可验收的步骤——第一价值闭环、功能边界、MVP
              顺序都出自这套能力。
            </li>
            <li>
              <strong>7 年质量保证（QA）经验</strong>：验收标准、缺陷归因、质量门禁方法论。教育产品最怕「说得漂亮、做得走样」，我们的
              12 条红线、交付前质量门、过程掌握门，本质是把 QA 的门禁方法搬进内容生产：任何一条不过，整批退回。
            </li>
            <li>
              <strong>6 个月、6 个 AI Agent 实战</strong>：从设计、编排、落盘到日志回溯完整跑过一遍，
              <strong>理解 AI 能干什么、更理解它不能干什么</strong>——这正是 §5 那张边界表的来处。
            </li>
          </ul>
          <p>
            组合价值一句话：教育方法论要「既懂怎么教，也懂怎么验收，还懂让 AI 只干它该干的活」。我们提供的是
            <strong>可审校的工程化体系</strong>，不是名人站台。
          </p>
          <p className="notice">
            口径说明：本章按 founder 已批 Q-b 口径，只写能力资产（年限、领域、实战数量），不写任何个人隐私信息。
          </p>
        </section>

        <section className="card">
          <h2>§7 我们的承诺</h2>
          <div className="table-wrap">
            <table className="article-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>承诺</th>
                  <th>展开</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>
                    <strong>无广告</strong>
                  </td>
                  <td>产品内不接广告，不靠注意力变现</td>
                </tr>
                <tr>
                  <td>2</td>
                  <td>
                    <strong>儿童数据不外发</strong>
                  </td>
                  <td>孩子记录默认留本机，不上云、不进日志正文、不用于第三方模型</td>
                </tr>
                <tr>
                  <td>3</td>
                  <td>
                    <strong>不承诺永久服务</strong>
                  </td>
                  <td>
                    我们不承诺「服务永远在线」；若停服，<strong>提前通知，并保证记录可导出</strong>
                  </td>
                </tr>
                <tr>
                  <td>4</td>
                  <td>
                    <strong>不制造焦虑</strong>
                  </td>
                  <td>不用关键期恐吓、不拿同龄人施压、不发排名与分数</td>
                </tr>
                <tr>
                  <td>5</td>
                  <td>
                    <strong>不宣称官方等级</strong>
                  </td>
                  <td>
                    E0–E3 等为<strong>自建能力轴</strong>，不是 CEFR / 剑桥 / 课标官方等级，
                    <strong>E3 ≠ Starters</strong>；外部体系仅作参照方向，授权状态一律标「待核实」
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            这五条与文末 12 条红线同源：红线不是文案禁忌清单，是我们对自己的交付约束——
            <strong>任何一条不过，整批退回。</strong>
          </p>
        </section>

        <details>
          <summary>附一：红线自检表（12 条逐条，点击展开）</summary>
          <div className="table-wrap">
            <RedLineTable />
          </div>
          <p>
            配套硬门禁（与红线同级）：隐私（无相机/录音/定位/通讯录；孩子记录不上云）、权利（不内置原书书库）、记录事实链（播放不落能力事实）——本文章均未违反。
          </p>
          <p>
            结论：<strong>12/12 通过</strong>。自检声明不替代终审（终审按内容审校流程执行）。
          </p>
        </details>

        <details>
          <summary>附二：参考口径来源注（点击展开）</summary>
          <div className="table-wrap">
            <SourceNotesTable />
          </div>
        </details>

        <p className="notice">
          <strong>诚实声明：</strong>
          本文为设计产物说明，非运行验证效果报告；文中证据强度标注为体系沿用判断，非本文完成的系统综述；E0–E3
          能力描述为产品设计参数，非常模；参照体系商用授权状态一律「待核实」。
        </p>
      </article>

      <p>
        <Link to="/settings">回到设置</Link>
      </p>
      <p>
        <Link to="/today">回到今日</Link>
      </p>
    </Screen>
  );
}

export default AboutScreen;
