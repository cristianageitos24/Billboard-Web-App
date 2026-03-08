'use client';

import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Settings: minimal shell for account/org preferences.
 * Makes the product feel complete and trustworthy as a SaaS.
 */
export default function SettingsPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent('/settings')}`);
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <p className="text-sm text-neutral-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      <div className="border-b border-neutral-200 bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-neutral-600 hover:text-neutral-900 underline">
            ← Back to Dashboard
          </Link>
        </div>
        <h1 className="text-xl font-bold text-neutral-900 mt-2">Settings</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Manage your account and preferences.
        </p>
      </div>
      <div className="flex-1 p-6 max-w-2xl space-y-6">
        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-2">Account</h2>
          <p className="text-sm text-neutral-600">{user.email}</p>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-2">Data &amp; integrations</h2>
          <p className="text-sm text-neutral-600 mb-4">
            Connect your CRM or add referral sources so we can attribute leads and revenue to your billboards. Right now, metrics are entered manually per board.
          </p>
          <ul className="text-sm text-neutral-500 space-y-2 list-disc list-inside">
            <li>CRM (e.g. HubSpot, Salesforce): coming soon</li>
            <li>Referral / lead source attribution: coming soon</li>
          </ul>
          <p className="text-xs text-neutral-400 mt-3">
            When available, integrations will plug into the same dashboard and ROI views you use today.
          </p>
        </section>
      </div>
    </main>
  );
}
