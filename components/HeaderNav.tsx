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
    <header className="border-b border-stone bg-evergreen text-warm-white">
      <div className="mx-auto flex max-w-[76rem] flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
        <p className="font-serif text-2xl font-semibold tracking-tight text-warm-white">Welch Wholesale</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
          <nav className="flex flex-wrap gap-2 text-sm font-medium text-warm-white/80 sm:gap-3">
            {links.map((link) => {
              const isActive = pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-4 py-1.5 transition ${
                    isActive
                      ? 'bg-moss text-warm-white shadow-card'
                      : 'text-warm-white/80 hover:bg-moss/40 hover:text-warm-white'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex flex-col items-start gap-1 text-xs text-olive-tint sm:items-end">
            {user ? (
              <>
                <p className="text-sm font-semibold text-warm-white">
                  {user.displayName || user.email || 'Signed in'}
                </p>
                {!canAccessRestricted && (
                  <p className="text-[11px] font-medium text-soft-clay">No access to restricted tabs</p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    void signOut().catch(() => undefined);
                  }}
                  className="text-xs font-semibold text-warm-white/80 underline transition hover:text-warm-white"
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
                className="inline-flex items-center rounded-md border border-transparent bg-harvest px-4 py-2 text-sm font-semibold text-warm-white transition hover:bg-harvest-hover active:bg-harvest-active disabled:cursor-not-allowed disabled:bg-harvest/60"
              >
                {loading ? 'Checking access…' : 'Sign in with Google'}
              </button>
            )}
            {error && <p className="text-[11px] font-medium text-soft-clay">{error}</p>}
          </div>
        </div>
      </div>
    </header>
  );
}
