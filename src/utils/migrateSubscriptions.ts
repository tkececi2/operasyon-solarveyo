import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

// Minimal callable runner for backend migration
export async function runSubscriptionMigration(): Promise<{ updated: number }> {
  const fn = httpsCallable(functions, 'migrateSubscriptions');
  const res = await fn({});
  return (res.data as any) || { updated: 0 };
}
