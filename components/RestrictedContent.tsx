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
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Checking your access&hellip;
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 text-slate-700">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-500">Restricted area</p>
          <h2 className="text-xl font-semibold text-slate-900">Sign in to continue</h2>
          <p className="text-sm text-slate-600">
            Use your Google account to access the {featureLabel.toLowerCase()} workflow.
          </p>
        </div>
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        <button
          type="button"
          onClick={() => {
            void signInWithGoogle().catch(() => undefined);
          }}
          className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  if (!canAccessRestricted) {
    return (
      <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <h2 className="text-lg font-semibold">Access pending</h2>
        <p>
          You are signed in as <span className="font-semibold">{user.email || user.displayName}</span>, but you do not have
          permission to view the {featureLabel.toLowerCase()} area.
        </p>
        <p>Please reach out to the admin to be added to the allow list.</p>
      </div>
    );
  }

  return <>{children}</>;
}
