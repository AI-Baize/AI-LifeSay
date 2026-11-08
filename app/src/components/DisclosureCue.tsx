export function ChevronIcon({ up = false }: { up?: boolean }) {
  return <svg className={`chevron-icon${up ? ' is-up' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

export function DisclosureCue({ open }: { open?: boolean }) {
  return <span className={`disclosure-cue${open ? ' is-open' : ''}`}><span className="cue-expand">展开</span><span className="cue-collapse">收起</span><ChevronIcon/></span>;
}
