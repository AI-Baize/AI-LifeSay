import { useEffect, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { BottomNavigation } from './BottomNavigation';
export function AppShell({ children }: { children: ReactNode }) {
  const { pathname, search } = useLocation();
  const location=pathname+search;
  const previous=useRef(location);
  useEffect(()=>{if(previous.current!==location){window.scrollTo(0,0);document.querySelector<HTMLElement>('main h1')?.focus();previous.current=location;}},[location]);
  const focusMode = (pathname.startsWith('/activity/') && pathname !== '/activity/prepare') || pathname.startsWith('/learn/play/') || pathname.startsWith('/stories/');
  return (
    <>
      <main>{children}</main>
      {!focusMode && <BottomNavigation />}
    </>
  );
}
