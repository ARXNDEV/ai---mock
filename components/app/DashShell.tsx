import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

export function DashShell({
  email,
  plan,
  children,
}: {
  email: string;
  plan: string;
  children: ReactNode;
}) {
  return (
    <div className="dash">
      <Sidebar email={email} plan={plan} />
      <main className="main">{children}</main>
    </div>
  );
}
