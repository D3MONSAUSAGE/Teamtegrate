import React, { useCallback, useRef, useState } from 'react';
import { inventoryCountsApi } from '@/contexts/inventory/api';
import { features } from '@/config/features';

type Key = string; // countItemId

type PendingMap = Record<Key, number>;
type InFlightMap = Record<Key, boolean>;

export function useScanEngineV2(countId?: string) {
  const [pendingByKey, setPendingByKey] = React.useState<PendingMap>({});
  const inFlightRef = React.useRef<InFlightMap>({});
  const lastConfirmedRef = React.useRef<Record<Key, number>>({});
  const timersRef = React.useRef<Record<Key, number | undefined>>({});

  // ========== PUBLIC: compute the number to show ==========
  function getDisplayActual(key?: Key, serverActual?: number): number {
    if (!key) return serverActual ?? 0;
    const pending = pendingByKey[key] ?? 0;
    const lastConfirmed = lastConfirmedRef.current[key] ?? 0;
    const base = Math.max(serverActual ?? 0, lastConfirmed);
    return base + pending;
  }

  // ========== INTERNAL: increment & schedule persist ==========
  function applyIncrement(key: Key, delta: number, serverActual?: number) {
    console.log('[INCREMENT]', { key, delta, pendingBefore: pendingByKey[key] ?? 0 });
    // Record baseline so we don't render lower than what we've seen confirmed
    const baseline = serverActual ?? 0;
    lastConfirmedRef.current[key] = Math.max(lastConfirmedRef.current[key] ?? 0, baseline);

    setPendingByKey(p => ({ ...p, [key]: (p[key] ?? 0) + delta }));
    schedulePersist(key);
  }

  function schedulePersist(key: Key) {
    // 300–400ms is good balance for scan guns
    clearTimeout(timersRef.current[key]);
    timersRef.current[key] = window.setTimeout(() => persistKey(key), 350);
  }

  async function persistKey(key: Key) {
    if (inFlightRef.current[key]) return;
    const pending = pendingByKey[key] ?? 0;
    if (!pending) return;

    inFlightRef.current[key] = true;
    try {
      console.log('[BUMP_REQUEST]', { key, pending });
      if (!countId) {
        console.error('[BUMP_FAIL] No countId provided to useScanEngineV2');
        return;
      }
      const updated = await inventoryCountsApi.bumpActual(countId, key, pending);
      console.log('[BUMP_RESPONSE]', { key, pending, updated });
      // DO NOT clear pending here. Wait for refetch confirmation.
    } catch (e) {
      console.error('[BUMP_FAIL]', { key, pending, error: e });
      // keep pending so user doesn't lose counts; can retry
    } finally {
      inFlightRef.current[key] = false;
    }
  }

  // ========== PUBLIC: call this when count items are (re)fetched ==========
  function onItemsRefetched(items: Array<{ id: string; actual_quantity: number }>) {
    console.log('[REFETCHED_ITEMS]', items.map(i => ({ id: i.id, actual: i.actual_quantity })));
    setPendingByKey(prev => {
      const next = { ...prev };
      for (const ci of items) {
        const key = ci.id;
        const pending = prev[key] ?? 0;
        const lastConfirmed = lastConfirmedRef.current[key] ?? 0;
        const mustBe = lastConfirmed + pending;
        const server = ci.actual_quantity ?? 0;
        // server "caught up" → clear pending & update lastConfirmed
        if (server >= mustBe) {
          next[key] = 0;
          lastConfirmedRef.current[key] = server;
        } else {
          // server behind; keep pending sticky
          lastConfirmedRef.current[key] = Math.max(lastConfirmed, server);
        }
      }
      return next;
    });
  }

  // Debug handle
  React.useEffect(() => {
    (window as any).__scan = { pending: pendingByKey };
  }, [pendingByKey]);

  return {
    // expose what your UI needs
    getDisplayActual,
    applyIncrement,
    onItemsRefetched,
    // expose pending for badges if you want
    pendingByKey,
  };
}