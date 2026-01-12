'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface RestrictedContentProps {
  children: ReactNode;
  featureLabel: string;
}

export default function RestrictedContent({ children, featureLabel }: RestrictedContentProps) {
  const { user, loading, error, canAccessRestricted, signInWithGoogle } = useAuth();

  if (loading) {
    return (
      <div className="rounded-card border border-stone bg-white p-6 text-sm text-sage shadow-card">
        Checking your access&hellip;
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4 rounded-card border border-stone bg-white p-6 text-sage shadow-card">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-sage">Restricted area</p>
          <h2 className="text-2xl font-semibold text-evergreen">Sign in to continue</h2>
          <p className="text-sm text-sage">
            Use your Google account to access the {featureLabel.toLowerCase()} workflow.
          </p>
        </div>
        {error && <p className="text-sm font-medium text-[#B42318]">{error}</p>}
        <button
          type="button"
          onClick={() => {
            void signInWithGoogle().catch(() => undefined);
          }}
          className="inline-flex items-center justify-center rounded-md bg-harvest px-4 py-2 text-sm font-semibold text-warm-white transition hover:bg-harvest-hover active:bg-harvest-active"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  if (!canAccessRestricted) {
    return (
      <div className="space-y-3 rounded-card border border-soft-clay bg-soft-clay/30 p-6 text-sm text-evergreen shadow-card">
        <h2 className="text-xl font-semibold text-evergreen">Access pending</h2>
        <p className="text-sage">
          You are signed in as <span className="font-semibold">{user.email || user.displayName}</span>, but you do not have
          permission to view the {featureLabel.toLowerCase()} area.
        </p>
        <p className="text-sage">Please reach out to the admin to be added to the allow list.</p>
      </div>
    );
  }

  return <>{children}</>;
}
