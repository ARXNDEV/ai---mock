import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ className, href = '/' }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn('logo', className)}>
      Intervue<span style={{ color: 'var(--accent)' }}>.ai</span>
    </Link>
  );
}
