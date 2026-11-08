import type { ReactNode } from 'react';
import { Link, useInRouterContext, useLocation } from 'react-router-dom';
function BackLink(){
  const {pathname}=useLocation();
  const target=pathname.startsWith('/themes/')||pathname.startsWith('/goals/')||pathname.startsWith('/observations/')||pathname.startsWith('/lessons/')?'/themes':
    pathname.startsWith('/scenes/')?'/scenes':pathname.startsWith('/records/')?'/records':
    pathname.startsWith('/settings/')?'/settings':pathname.startsWith('/results/')||pathname.startsWith('/history/period/')?'/history/calendar':null;
  return target?<Link className="back-link" to={target}>← 返回{target==='/themes'?'活动列表':target==='/scenes'?'场景图库':target==='/records'?'记录列表':target==='/settings'?'家长设置':'学习日历'}</Link>:null;
}
export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  const inRouter=useInRouterContext();
  return (
    <header className="page-header">
      {inRouter&&<BackLink/>}
      <h1 tabIndex={-1}>{title}</h1>
      {action}
    </header>
  );
}
