import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ className, href = '/' }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn('logo', className)}>
      <img
        src="/logo-arrow.png"
        alt=""
        width={30}
        height={28}
        style={{ display: 'block', marginRight: 8 }}
      />
      Intervue<span style={{ color: 'var(--accent)' }}>.ai</span>
    </Link>
  );
}
