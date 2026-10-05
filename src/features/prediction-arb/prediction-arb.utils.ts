/**
 * Shared helpers for computing market expiry time from a strategy's endDate
 * or its slug (which encodes the window start as a Unix timestamp).
 *
 * Both server scripts and the frontend board import this so the expiry
 * logic is consistent everywhere.
 */

export interface HasExpiry {
  endDate?: Date | string | null;
  slug?: string;
}

/**
 * Computes the market end time in epoch milliseconds.
 *
 * Priority:
 *  1. `endDate` field (Mongo Date or ISO string) — the Gamma API's own
 *     resolution/end time, stored when the strategy was scanned.
 *  2. `slug` trailing Unix timestamp — used as a fallback for updown 5m/15m
 *     markets whose slug looks like `btc-updown-5m-1790793900`.
 *
 * Returns 0 when neither source yields a valid future-or-past end time.
 */
export function getEndMs(item: HasExpiry): number {
  if (item.endDate) {
    const t = new Date(item.endDate).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (item.slug) {
    const m = item.slug.match(/-(\d{10})$/);
    if (m) {
      const slot = Number(m[1]);
      const dur = item.slug.includes("-5m-") ? 300 : item.slug.includes("-15m-") ? 900 : 3600;
      return (slot + dur) * 1000;
    }
  }
  return 0;
}
