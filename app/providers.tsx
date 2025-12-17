'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { PricingProvider } from '@/contexts/PricingContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PricingProvider>{children}</PricingProvider>
    </AuthProvider>
  );
}
