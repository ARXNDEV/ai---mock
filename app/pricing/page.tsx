import Link from 'next/link';
import { getUser } from '@/lib/auth';
import { Logo } from '@/components/brand/logo';
import PricingClient from '@/components/pricing/PricingClient';

export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  const user = await getUser();

  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          <Logo href={user ? '/dashboard' : '/'} />
          <Link href={user ? '/dashboard' : '/login'} className="btn btn-ghost btn-sm">
            {user ? 'Dashboard' : 'Sign in'}
          </Link>
        </div>
      </header>
      <main style={{ maxWidth: 1240, margin: '0 auto', padding: '56px 40px 90px' }}>
        <PricingClient isAuthed={!!user} />
      </main>
    </>
  );
}
