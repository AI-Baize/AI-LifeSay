import { useId, useState, type ReactNode } from 'react';
import { ChevronIcon, DisclosureCue } from './DisclosureCue';

/** Collapsible parent reference with a second, explicit close control at the end. */
export function ParentDisclosure({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const contentId = useId();

  return (
    <section className="parent-disclosure">
      <button
        className="parent-disclosure-toggle"
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen(value => !value)}
      >
        <span>{title}</span>
        <DisclosureCue open={open}/>
      </button>
      {open && (
        <div className="parent-disclosure-content" id={contentId}>
          {children}
          <button className="parent-disclosure-close" type="button" onClick={() => setOpen(false)}>
            <ChevronIcon up/>收起
          </button>
        </div>
      )}
    </section>
  );
}
