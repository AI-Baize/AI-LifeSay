import { useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { useLearningStore } from '../stores/learningStore';
import { useAction } from '../pages/shared';
export function SceneAutoplaySetting(){
 const snapshot=useAppStore(v=>v.snapshot),a=useAction(),[draft,setDraft]=useState<boolean|null>(null),enabled=draft??snapshot?.settings?.scene_autoplay??true;
 return <section className="card" aria-label="场景播放设置"><h2>场景播放</h2><label><input type="checkbox" checked={enabled} disabled={a.busy||!snapshot?.profile} onChange={e=>{const value=e.target.checked;setDraft(value);void a.run(()=>useLearningStore.getState().saveSceneAutoplay(value)).finally(()=>setDraft(null));}}/>自动播放</label><p>默认开启，进入场景图片后播放一轮对话。关闭后，只在点击图片人物或对话时播放。</p>{!snapshot?.profile&&<p>建立本机档案后可保存设置。</p>}{a.notice}</section>;
}
