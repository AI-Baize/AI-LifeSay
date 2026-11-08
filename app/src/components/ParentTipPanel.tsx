import { useState } from 'react';
export function ParentTipPanel({ text }: { text: string }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="card">
      <button type="button" onClick={() => setOpen(v => !v)}>
        {open ? '收起家长提示' : '展开家长提示'}
      </button>
      {open && <p>{text}</p>}
    </section>
  );
}
