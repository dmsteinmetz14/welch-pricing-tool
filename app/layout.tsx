import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import HeaderNav from '@/components/HeaderNav';

export const metadata: Metadata = {
  title: 'Welch Flower Pricing Tool',
  description: 'Lightweight wholesale flower pricing planner',
  icons: {
    icon: '/flower-icon.svg',
    shortcut: '/flower-icon.svg',
    apple: '/flower-icon.svg'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-warm-white text-charcoal">
        <Providers>
          <div className="min-h-screen">
            <HeaderNav />
            <main className="mx-auto max-w-[76rem] px-4 py-10 sm:px-6 lg:px-10">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
