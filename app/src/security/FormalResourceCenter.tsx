import developerQr from '../assets/developer-wechat.png';
import { useEffect, useRef, useState } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Link } from 'react-router-dom';
import { create } from 'zustand';
import { isOperationTestBuild, isLocalProductionAcceptanceBuild } from './formalLevelTrust';
import { importFormalLevelArchive, importFormalLevelLicense, listFormalLevels } from './formalLevelImport';

const device = registerPlugin<{shareFormalRequest(options?: {operationRequest: boolean; saveToFile?: boolean}): Promise<{status: string}>}>('DeviceApplication');
type ImportKind = 'archive' | 'license';
type ImportJob = {id: number; kind: ImportKind; name: string; status: '加载中' | '已完成' | '导入失败'; error?: string};
const useImportJobs = create<{jobs: ImportJob[]}>(() => ({jobs: []}));
let importSequence = 0;
let importQueue = Promise.resolve();

function enqueueImports(files: File[], kind: ImportKind) {
  const batch: ImportJob[] = files.map(file => ({id: ++importSequence, kind, name: file.name, status: '加载中'}));
  useImportJobs.setState(({jobs}) => ({jobs: [...batch, ...jobs]}));
  importQueue = importQueue.then(async () => {
    for (const [index, file] of files.entries()) {
      let result: Pick<ImportJob, 'status' | 'error'>;
      try {
        if (kind === 'archive') await importFormalLevelArchive(file);
        else await importFormalLevelLicense(file);
        result = {status: '已完成'};
      } catch (error) {
        result = {status: '导入失败', error: error instanceof Error ? error.message : '请重新选择文件'};
      }
      const id = batch[index]!.id;
      useImportJobs.setState(({jobs}) => ({jobs: jobs.map(job => job.id === id ? {...job, ...result} : job)}));
    }
  });
}

function ImportHistory({jobs}: {jobs: ImportJob[]}) {
  const [expanded, setExpanded] = useState(false);
  if (!jobs.length) return null;
  return <div className="resource-history" aria-live="polite">
    {(expanded ? jobs : jobs.slice(0, 1)).map(job => <p key={job.id}><strong>{job.name}</strong> · {job.status}{job.error && <span> · {job.error}</span>}</p>)}
    {jobs.length > 1 && <button type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? '收起' : `展开全部（${jobs.length}）`}</button>}
  </div>;
}

export default function FormalResourceCenter() {
  const qrDialog = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState('');
  const [requestBusy, setRequestBusy] = useState(false);
  const [choosing, setChoosing] = useState<ImportKind | null>(null);
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listFormalLevels>>>([]);
  const [listError, setListError] = useState('');
  const [expanded, setExpanded] = useState(false);
  const jobs = useImportJobs(state => state.jobs);

  useEffect(() => {
    let active = true;
    let generation = 0;
    const refresh = async () => {
      const current = ++generation;
      try {
        const installed = await listFormalLevels();
        if (active && current === generation) { setRows(installed); setListError(''); }
      } catch (error) {
        if (active && current === generation) setListError(error instanceof Error ? error.message : '无法读取课程');
      }
    };
    void refresh();
    window.addEventListener('lifesay-resources-changed', refresh);
    return () => { active = false; window.removeEventListener('lifesay-resources-changed', refresh); };
  }, []);

  if (choosing) {
    const title = choosing === 'archive' ? '选择课程资源包' : '选择设备许可';
    return <section><button type="button" onClick={() => setChoosing(null)}>返回</button>
      <h1>{title}</h1><p>{choosing === 'archive' ? '可一次选择多个课程资源 ZIP 文件。' : '可一次选择多份运营者签发的设备许可 JSON 文件。'}</p>
      <label>打开文件选择器<input type="file" multiple accept={choosing === 'archive' ? '.zip' : '.json'} onChange={event => {
        const files = Array.from(event.target.files ?? []);
        if (!files.length) return;
        enqueueImports(files, choosing);
        setChoosing(null);
      }}/></label>
    </section>;
  }

  return <section><h1>课程资源与设备申请</h1>
    <p>{import.meta.env.VITE_FORMAL_TRUST_PREVIEW === '1' ? '正式签发身份联测版。请仅导入经批准、与当前正式身份匹配的资源和设备许可。' : import.meta.env.VITE_GITHUB_RELEASE === '1' ? '免费场景随 App 提供。新增课程开放后，可导入运营者提供的加密资源包和本机设备许可。' : isLocalProductionAcceptanceBuild() ? '本地生产验收版，请导入配套课程和设备许可。' : isOperationTestBuild() ? '内部签发联测版，请导入配套测试课程和设备许可。' : '课程资源保存在本机。当前正式签名身份尚未配置，暂不能导入新课程。'}</p>
    <p>可以先保存资源包，导入匹配的本机许可后即可使用对应课程。</p>
    <div className="resource-import-option">
      <button type="button" onClick={() => setChoosing('archive')}>选择课程资源包</button>
      <ImportHistory jobs={jobs.filter(job => job.kind === 'archive')}/>
    </div>
    <div className="resource-import-option">
      <button type="button" onClick={() => setChoosing('license')}>选择设备许可</button>
      <ImportHistory jobs={jobs.filter(job => job.kind === 'license')}/>
    </div>
    <section className="resource-history" aria-labelledby="imported-resource-title">
      <h2 id="imported-resource-title">查看已导入资源</h2>
      {listError ? <p role="status">{listError}</p> : rows.length ? <>
        {(expanded ? rows : rows.slice(0, 1)).map(row => <article key={row.id}>
          <h3>{row.archiveName}</h3><p className="product-muted">{row.level} · 资源版本：{row.version}</p>
          <p>许可状态：{row.authorized ? '正常' : '无许可'}</p>
        </article>)}
        {rows.length > 1 && <button type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? '收起' : `展开全部（${rows.length}）`}</button>}
      </> : <p>暂无已导入资源。</p>}
    </section>
    <section className="course-contact"><h2>获取更多课程</h2><p>更多课程请联系 <strong>Baize_Cyber</strong></p><button className="developer-qr-preview" aria-label="查看开发者二维码大图" onClick={()=>qrDialog.current?.showModal()}><img src={developerQr} alt="开发者白泽微信二维码"/></button><p>点击二维码查看大图</p><dialog ref={qrDialog} className="developer-qr-dialog" aria-labelledby="developer-qr-title"><h2 id="developer-qr-title">开发者微信</h2><img src={developerQr} alt="开发者白泽微信二维码原图"/><button onClick={()=>qrDialog.current?.close()}>关闭</button></dialog></section>
    <h2>设备申请</h2><p>申请包含项目、环境、应用版本、申请编号、设备公钥和协议能力，不含私钥；请将原始JSON文件私密交给运营者，不要把内容复制到公开聊天。请在系统分享中选择可信的私聊对象。打开分享不表示已发送或获得许可。</p><button disabled={requestBusy||!Capacitor.isNativePlatform()} onClick={async()=>{setRequestBusy(true);try{await device.shareFormalRequest({operationRequest:true});setMessage('已打开系统分享，请确认接收人。');}catch{setMessage('无法生成设备申请，请检查设备和应用身份。');}finally{setRequestBusy(false);}}}>生成并私密分享设备申请</button><button disabled={requestBusy||!Capacitor.isNativePlatform()} onClick={async()=>{setRequestBusy(true);try{const result=await device.shareFormalRequest({operationRequest:true,saveToFile:true});setMessage(result.status==='saved'?'设备申请已保存':'已取消保存');}catch{setMessage('无法保存设备申请，请重试。');}finally{setRequestBusy(false);}}}>保存设备申请文件</button><p role="status">{message}</p><Link to="/me">返回我的</Link>
  </section>;
}
