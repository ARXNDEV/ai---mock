import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function GlassCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn('glass rounded-[18px]', className)}>{children}</div>;
}

/** Accent-tinted bordered card (used for upgrade prompts). */
export function GradientBorderCard({
  className,
  innerClassName,
  children,
}: {
  className?: string;
  innerClassName?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'rounded-[18px] border border-[rgba(229,64,43,0.35)] bg-[linear-gradient(105deg,rgba(229,64,43,0.08),rgba(240,87,59,0.02))]',
        className,
      )}
    >
      <div className={innerClassName}>{children}</div>
    </div>
  );
}
