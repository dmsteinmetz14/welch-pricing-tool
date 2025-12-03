'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';

const links: { href: Route; label: string }[] = [
  { href: '/input', label: 'Input' },
  { href: '/price-sheet', label: 'Price Sheet' },
  { href: '/suppliers', label: 'Suppliers' }
];

export default function HeaderNav() {
  const pathname = usePathname();

  return (
    <header className="bg-white shadow-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <p className="text-lg font-semibold text-slate-900">Welch Wholesale</p>
        <nav className="flex gap-4 text-sm font-medium text-slate-500">
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
      </div>
    </header>
  );
}
