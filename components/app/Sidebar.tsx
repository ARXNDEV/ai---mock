'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Mic, History, FileText, Settings, LogOut } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/interview', label: 'New Interview', icon: Mic },
  { href: '/history', label: 'History', icon: History },
];

const soonItems: { label: string; icon: LucideIcon }[] = [
  { label: 'Resume Analyzer', icon: FileText },
  { label: 'Settings', icon: Settings },
];

export function Sidebar({ email, plan }: { email: string; plan: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const name = email ? email.split('@')[0] : 'there';

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <aside className="sidebar">
      <div className="side-logo">
        Intervue<span style={{ color: 'var(--accent)' }}>.ai</span>
      </div>
      <nav className="side-nav">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={active ? 'side-item active' : 'side-item'}>
              <item.icon strokeWidth={1.6} /> {item.label}
            </Link>
          );
        })}
        {soonItems.map((item) => (
          <span key={item.label} className="side-item" style={{ opacity: 0.45, cursor: 'default' }}>
            <item.icon strokeWidth={1.6} /> {item.label}
          </span>
        ))}
      </nav>
      <div className="side-user">
        <div className="avatar">{(email || '?').slice(0, 1).toUpperCase()}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="nm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name}
          </div>
          <div className="pl">✦ {plan === 'pro' ? 'Pro Plan' : 'Free Plan'}</div>
        </div>
        <button type="button" onClick={signOut} title="Sign out" style={{ color: 'var(--ink-mute)' }}>
          <LogOut width={16} height={16} />
        </button>
      </div>
    </aside>
  );
}
