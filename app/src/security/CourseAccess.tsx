import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { checkCourseUpdate, courseStatus, createActivationRequest, downloadCourse, importLicense } from './courseVault';
import type { SignedEnvelope } from './protocol';

function downloadJson(value: unknown, name: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value)], { type: 'application/json' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function CourseAccess() {
  const [status, setStatus] = useState<Awaited<ReturnType<typeof courseStatus>>>();
  const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  const refresh = () => courseStatus().then(setStatus);
  useEffect(() => { let alive = true; void courseStatus().then(value => { if (alive) setStatus(value); }).catch(error => { if (alive) setMessage((error as Error).message); }); return () => { alive = false; }; }, []);
  const run = async (action: () => Promise<void>) => { setBusy(true); setMessage(''); try { await action(); await refresh(); } catch (error) { setMessage((error as Error).message); } finally { setBusy(false); } };
  return <section><h1>课程授权</h1><p>收费独立版提供C01、C02、C03全部场景，导入本机许可后使用；免费版的C01、C02无需密钥。</p><p>本机激活后可长期离线使用已下载课程，不按系统时间到期。</p><p>这是独立加密版的本地签发验证入口。请求文件仅包含设备公钥和课程版本，不含孩子学习记录。</p>{status && <p>当前课程约{Math.ceil(status.bytes / 1048576)} MiB，建议预留{Math.ceil(status.bytes / 1048576 * 1.5 + 50)} MiB空间并使用Wi-Fi下载；中断后可重新点击下载，已校验资源会复用。</p>}
    <p role="status">{status ? `${status.activated ? '本机已激活' : '尚未激活'} · ${status.downloaded ? '课程已完整下载' : '尚未完整下载'}` : '读取授权状态…'}</p>
    <div className="product-menu"><button disabled={busy} onClick={() => void run(async () => { downloadJson(await createActivationRequest(), 'aienglish-device-request.json'); setMessage('请求文件已导出，请交给授权管理员签发本机许可。'); })}>导出本机授权请求</button>
    <label>导入本机许可<input type="file" accept=".json,application/json" disabled={busy} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (!file) return; void run(async () => { if (file.size > 16384) throw new Error('许可文件过大'); await importLicense(JSON.parse(await file.text()) as SignedEnvelope); setMessage('本机授权成功，请下载课程后离线学习。'); }); }}/></label>
    {status?.activated && <button disabled={busy} onClick={() => void run(async () => { const request = await checkCourseUpdate(); if (!request) { setMessage('当前已是最新课程版本。'); return; } downloadJson(request, 'aienglish-update-request.json'); setMessage('发现新版，已导出更新请求。请管理员签发新版许可后导入；导入前原有离线课程继续可用。'); })}>检查课程更新</button>}
    <button disabled={busy || !status?.activated} onClick={() => void run(async () => { const persistent = await downloadCourse((done, total) => setMessage(`下载并校验课程：${done}/${total}`)); setMessage(`课程已完整下载。${persistent ? '浏览器已允许持久保存。' : '浏览器未保证持久存储，请勿清理站点数据。'}`); })}>下载全部课程供离线使用</button>
    <Link to="/today">返回首页学习</Link></div>
    {message && <p role="alert">{message}</p>}
    <p>设备身份绑定当前应用或浏览器存储。更换网址端口、浏览器，卸载或清理数据，可能需要重新联网激活；个人学习记录备份不含课程密钥。网页验证版不具备原生硬件密钥保护。</p>
  </section>;
}
