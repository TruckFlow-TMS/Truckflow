/**
 * One-time rename of the app's localStorage keys from the `nune_tms_` prefix to
 * `truckhq_`, carried out when the product was renamed to TruckHQ.
 *
 * Without this, the rename would silently discard every existing browser's
 * loads, invoices, payroll and audit history — the mock store is the only place
 * that data lives. Copies rather than moves, so an older build of the app run
 * against the same browser still finds its data.
 *
 * Runs before React mounts. Safe to call repeatedly: a key that already exists
 * under the new prefix is never overwritten.
 */

const OLD_PREFIX = 'nune_tms_';
const NEW_PREFIX = 'truckhq_';

export function migrateStorage(): void {
  let storage: Storage;
  try {
    storage = window.localStorage;
  } catch {
    // Private modes and blocked-cookie settings throw on access alone.
    return;
  }

  try {
    for (const oldKey of Object.keys(storage)) {
      if (!oldKey.startsWith(OLD_PREFIX)) continue;

      const newKey = NEW_PREFIX + oldKey.slice(OLD_PREFIX.length);
      if (storage.getItem(newKey) !== null) continue;

      const value = storage.getItem(oldKey);
      if (value !== null) storage.setItem(newKey, value);
    }
  } catch {
    // A full quota or a revoked permission mid-loop must not stop the app from
    // booting; the worst case is that the user starts from seeded data.
  }
}
