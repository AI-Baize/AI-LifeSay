import { useState, type ReactNode } from 'react';
export function ParentActionGate({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <div className="stack">
        <p>这些操作会影响本机数据，请由家长确认后继续。</p>
        <button type="button" onClick={() => setOpen(true)}>
          我是家长，继续
        </button>
      </div>
    );
  }
  return <div className="stack">{children}</div>;
}
