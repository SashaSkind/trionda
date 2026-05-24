import { createHash } from 'node:crypto';
import type { Intent } from '@/lib/types';

type Entry<V> = { value: V; timer: ReturnType<typeof setTimeout> };

export class TTLCache<K, V> {
  private store = new Map<K, Entry<V>>();
  constructor(private defaultTtlMs: number = 30 * 60 * 1000) {}

  get(key: K): V | undefined {
    return this.store.get(key)?.value;
  }

  set(key: K, value: V, ttlMs: number = this.defaultTtlMs): void {
    const existing = this.store.get(key);
    if (existing) clearTimeout(existing.timer);
    const timer = setTimeout(() => this.store.delete(key), ttlMs);
    if (typeof (timer as unknown as { unref?: () => void }).unref === 'function') {
      (timer as unknown as { unref: () => void }).unref();
    }
    this.store.set(key, { value, timer });
  }

  async getOrSet(key: K, factory: () => Promise<V>, ttlMs?: number): Promise<V> {
    const hit = this.get(key);
    if (hit !== undefined) return hit;
    const value = await factory();
    this.set(key, value, ttlMs);
    return value;
  }

  delete(key: K): void {
    const existing = this.store.get(key);
    if (existing) clearTimeout(existing.timer);
    this.store.delete(key);
  }

  keys(): K[] {
    return Array.from(this.store.keys());
  }
}

export function intentCacheKey(stadiumSlug: string, intent: Intent): string {
  // Stable hash over the dimensions that change retrieval results. We include
  // a normalized version of the raw user query so that two questions with the
  // same vibe_tags (e.g. "tacos" and "ramen" both → ['food']) still get
  // distinct cache entries.
  const vibes = [...intent.vibe_tags].sort().join(',');
  const tw = intent.time_window ? `${intent.time_window.start}-${intent.time_window.end}` : '';
  const rawNorm = intent.raw.toLowerCase().replace(/\s+/g, ' ').trim();
  const composite = `${stadiumSlug}::${vibes}::${tw}::${intent.radius_m}::${intent.date ?? ''}::${rawNorm}`;
  return createHash('sha1').update(composite).digest('hex').slice(0, 16);
}

// Singleton cache used by the API route to memoize full agent results
// across requests (and to absorb prewarm script output).
import type { RankedRecommendation, SourcePill } from '@/lib/types';

export type CachedAgentResult = {
  intent: Intent;
  recommendations: RankedRecommendation[];
  sources: SourcePill[];
  synthesis: string;
};

export const agentResultCache = new TTLCache<string, CachedAgentResult>(60 * 60 * 1000);
