import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import HeaderNav from '@/components/HeaderNav';

export const metadata: Metadata = {
  title: 'Welch Flower Pricing Tool',
  description: 'Lightweight wholesale flower pricing planner'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">
        <Providers>
          <div className="min-h-screen">
            <HeaderNav />
            <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
