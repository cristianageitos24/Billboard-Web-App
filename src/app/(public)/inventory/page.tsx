'use client';

import InventoryView from '@/components/InventoryView';

/**
 * Inventory: map + list + detail panel for browsing and adding boards.
 * Linked from nav so logged-in users can reach it as a supporting tool.
 */
export default function InventoryPage() {
  return (
    <InventoryView
      title="Inventory"
      subtitle="Find boards to add to your tracked campaigns."
    />
  );
}
