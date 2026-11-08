import { useState } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Link } from 'react-router-dom';
import { importLevelArchive, importLevelLicense, previewInstalled, browserTestRequest } from './levelImport';

const device = registerPlugin<{ shareRequest(): Promise<{ status: string }> }>('DeviceApplication');
export default function ResourceCenter() {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [installed, setInstalled] = useState<{id:string;text:string}[]>([]);
  const load = async (file: File, license: boolean) => { setBusy(true); try { if(license) await importLevelLicense(file); else await importLevelArchive(file); setMessage(license ? '本机许可已保存' : '资源包已验签并自动解包保存'); setInstalled(await previewInstalled()); } catch(error) { setMessage((error as Error).message); } finally {setBusy(false);} };
  return <section><h1>课程资源与设备申请</h1><p>隔离测试：此入口只接受本轮测试签名的合成资源，不用于真实购买授权。</p><h2>导入课程资源</h2><label>选择测试加密ZIP包<input type="file" accept=".zip" disabled={busy} onChange={event=>{const f=event.target.files?.[0];event.target.value='';if(f)void load(f,false);}}/></label><label>导入本机测试许可<input type="file" accept=".json" disabled={busy} onChange={event=>{const f=event.target.files?.[0];event.target.value='';if(f)void load(f,true);}}/></label><button disabled={busy} onClick={async()=>{try{setInstalled(await previewInstalled());}catch{setMessage('无法读取已安装资源，请核对本机许可');}}}>查看已安装资源</button>{installed.map(row=><article key={row.id}><h3>{row.id}</h3><p>{row.text}</p></article>)}<h2>设备申请</h2><p>设备申请只包含应用版本、申请编号和设备公钥，不包含孩子的学习记录。请在系统分享中选择与运营者的私聊，不要发送到群聊或公开页面。</p>
    <button disabled={busy || !Capacitor.isNativePlatform()} onClick={async () => { setBusy(true); setMessage(''); try { await device.shareRequest(); setMessage('已打开系统分享，请自行确认接收人。打开分享不代表已经送达或获得授权。'); } catch { setMessage('暂时无法创建设备申请，请重试。'); } finally { setBusy(false); } }}>生成并私密分享设备申请</button>
    {!Capacitor.isNativePlatform() && <button onClick={async()=>{const value=await browserTestRequest();const u=URL.createObjectURL(new Blob([JSON.stringify(value)],{type:'application/json'}));const a=document.createElement('a');a.href=u;a.download='test-device-request.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}}>导出浏览器测试申请</button>}
    <p role="status">{message}</p><p><Link to="/me">返回我的</Link></p></section>;
}
