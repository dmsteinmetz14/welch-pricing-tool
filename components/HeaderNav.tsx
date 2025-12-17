'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const links: { href: Route; label: string }[] = [
  { href: '/input', label: 'Flower Input' },
  { href: '/suppliers', label: 'Supplier Input' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/price-sheet', label: 'Price Sheet' }
];

export default function HeaderNav() {
  const pathname = usePathname();
  const { user, loading, error, canAccessRestricted, signInWithGoogle, signOut } = useAuth();

  return (
    <header className="bg-white shadow-sm">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="text-lg font-semibold text-slate-900">Welch Wholesale</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <nav className="flex flex-wrap gap-2 text-sm font-medium text-slate-500 sm:gap-4">
            {links.map((link) => {
              const isActive = pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-1 transition hover:text-slate-900 ${
                    isActive ? 'bg-slate-100 text-slate-900' : ''
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex flex-col items-start gap-1 text-xs text-slate-500 sm:items-end">
            {user ? (
              <>
                <p className="text-sm font-semibold text-slate-900">
                  {user.displayName || user.email || 'Signed in'}
                </p>
                {!canAccessRestricted && (
                  <p className="text-[11px] font-medium text-amber-600">No access to restricted tabs</p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    void signOut().catch(() => undefined);
                  }}
                  className="text-xs font-semibold text-slate-600 underline transition hover:text-slate-900"
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  void signInWithGoogle().catch(() => undefined);
                }}
                disabled={loading}
                className="rounded-md border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                {loading ? 'Checking access…' : 'Sign in with Google'}
              </button>
            )}
            {error && <p className="text-[11px] font-medium text-red-600">{error}</p>}
          </div>
        </div>
      </div>
    </header>
  );
}
