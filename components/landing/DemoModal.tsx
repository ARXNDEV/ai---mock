'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X, PlayCircle } from 'lucide-react';

export function DemoModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            background: 'rgba(26,23,18,0.55)',
            backdropFilter: 'blur(4px)',
          }}
        />
        <Dialog.Content
          className="glass"
          style={{
            position: 'fixed',
            left: '50%',
            top: '50%',
            zIndex: 61,
            transform: 'translate(-50%,-50%)',
            width: '92vw',
            maxWidth: 560,
            borderRadius: 18,
            padding: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Dialog.Title className="serif" style={{ fontSize: 24 }}>
              Product demo
            </Dialog.Title>
            <Dialog.Close aria-label="Close" style={{ color: 'var(--ink-soft)' }}>
              <X className="ico" width={20} height={20} />
            </Dialog.Close>
          </div>
          <div
            style={{
              aspectRatio: '16 / 9',
              width: '100%',
              borderRadius: 12,
              border: '1px solid var(--line)',
              background: 'var(--card-2)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--ink-mute)' }}>
              <PlayCircle width={44} height={44} className="ico" />
              <span className="mono" style={{ fontSize: 12 }}>
                Demo video coming soon
              </span>
            </div>
          </div>
          <Dialog.Description style={{ marginTop: 12, fontSize: 14, color: 'var(--ink-soft)' }}>
            A full walkthrough is on the way. For now, hit “Start For Free” and try a real interview.
          </Dialog.Description>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
