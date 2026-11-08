import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SCENE_PACKS, gatedAudioLines } from '../content/scenePacks';
import type { ScenePackUnit } from '../content/scenePacks/types';
import { Screen } from './shared';
import { AudioPhrase } from '../components/AudioPhrase';

// 场景课程库（2026-10-11，founder 指令：27 包补收编进部署包）。
//
// 口径（与 内容生产/02/03/04 号审校记录一致）：
// - 内容来源 = 30 个内容包（C01 家庭 15 / C02 生活知识 3 / C03 幼儿园 12）；
//   其中 C03 的 004/007/010 已进主题课程（kindergarten.json），本页只展示场景课程库视图的 27 个。
// - goal 三态：existing（三锚点 goal，可开放记录）/ new_goal（已解禁但 record 未开）/
//   input_only（纯熏听，无观察项）。
// - 两课独立：不适配的课程显示为「不适配不交付」，不假装有第二课。
// - 音频门控：观察段刺激行与答案行禁止自动播放（只作展示，标注「不自动播」）。
// - 不显示积分/评分/掌握词数/连胜链；点击与播放不计入记录、周报与建议。

const CLASS_LABEL: Record<"C01" | "C02" | "C03", string> = {
  C01: '家庭',
  C02: '生活知识',
  C03: '幼儿园'
};

function PackCard({u}:{u:ScenePackUnit}) {
 const gated=gatedAudioLines(u);
 return <li className="card"><h3>{u.title_zh}</h3><p>{u.goal_kind==='input_only'?'听一听，轻松接触英语':'家长带领，按四个小步骤玩一玩'}</p><p>{u.word_cards.length}个词语 · {u.courses.filter(c=>c.supported).map(c=>c.course_id==='dialogue'?'对话带领':'词卡带领').join('、')||'聆听内容'}</p>
 <details><summary>打开词语和分步带领</summary><p className="notice">本页可查看、手动播放；暂不创建活动记录。请勿把听过或跟说记为独立掌握。</p>
 <h4>词语</h4><div className="catalog-grid">{u.word_cards.map(w=><section key={w.word_en}><p className="english"><AudioPhrase text={w.word_en}/></p><p>{w.hint_zh}</p></section>)}</div>
 {u.courses.map(c=><details key={c.course_id}><summary>{c.course_id==='dialogue'?'对话带领':'词卡带领'}{!c.supported?' · 暂未开放':''}</summary>{!c.supported?<p>{c.unsupported_note_zh}</p>:c.steps.map(step=>{
  const line=u.audio.lines.find(l=>l.id===step.audio_line);
  return <section className="card" key={step.phase}><h4>{({prepare:'准备',practice:'一起练习',observe:'看看回应',finish:'结束'})[step.phase]}</h4><p>{step.instruction_zh}</p><p className="english"><AudioPhrase text={step.line_en} path={line?.text_en===step.line_en?u.audio.dir+line.id+'.m4a':null}/></p>{step.expected_response_en&&<details><summary>需要帮助时再看回应示例</summary><p>{step.expected_response_en}</p></details>}</section>;
 })}</details>)}<details><summary>更多聆听词句</summary>{u.audio.lines.filter(l=>l.auto_play).map(l=><p key={l.id}><AudioPhrase text={l.text_en} path={u.audio.dir+l.id+'.m4a'}/></p>)}</details><p><small>{gated.length>0?'观察与答案词句不自动播放。':''}所有音频均需手动点击。</small></p></details></li>;
}

export function ScenePackGalleryScreen(){
 const [category,setCategory]=useState('all'),[search,setSearch]=useState('');
 const visible=SCENE_PACKS.filter(u=>(category==='all'||u.class_id===category)&&(!search.trim()||u.title_zh.includes(search.trim())||u.word_cards.some(w=>w.word_en.toLowerCase().includes(search.trim().toLowerCase()))));
 return <Screen title="生活场景：词句与分步带领"><p>从熟悉的生活里接触英语。打开一个场景，看看词语，跟着四个步骤玩一玩。</p><p className="notice">这里可浏览和手动播放，暂不保存活动表现。想留下观察记录，请选择已开放的主题活动。</p>
 <div className="row"><label>生活场景<select value={category} onChange={e=>setCategory(e.target.value)}><option value="all">全部场景</option>{Object.entries(CLASS_LABEL).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label><label>找场景或英文词<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="例如：起床、hello"/></label></div><p role="status">找到{visible.length}个场景</p>
 <ul className="plain-list stack">{visible.map(u=><PackCard key={u.scene_id} u={u}/>)}</ul>{!visible.length&&<p>暂时没有匹配的场景，可以换个关键词或查看全部。</p>}
 <p><Link className="button-link" to="/themes">选择可记录的主题活动</Link> · <Link to="/scenes">场景点读图</Link></p><details><summary>内容来源与声音说明</summary><p>自制内容；音频为合成音。点击与播放不等于孩子掌握，也不生成能力结论。</p></details></Screen>;
}

export default ScenePackGalleryScreen;
