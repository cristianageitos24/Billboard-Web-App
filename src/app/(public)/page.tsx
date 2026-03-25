'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import InventoryView from '@/components/InventoryView';

/**
 * Home: logged-in users land on Dashboard; guests see the inventory map.
 * This makes the app feel like a SaaS dashboard (Dashboard-first) while
 * keeping inventory as a supporting tool reachable via nav.
 */
export default function Home() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <p className="text-sm text-neutral-500">Loading…</p>
      </main>
    );
  }

  if (user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <p className="text-sm text-neutral-500">Redirecting to dashboard…</p>
      </main>
    );
  }

  return (
    <InventoryView
      title="MarketTrace"
      subtitle="Find boards to add to your tracked campaigns."
    />
  );
}
