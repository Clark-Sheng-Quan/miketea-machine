import cron from 'node-cron';
import { FlavorSyncService } from './flavorSyncService.js';
import dotenv from 'dotenv';

dotenv.config();

export function setupScheduledTasks() {
  const syncInterval = process.env.FLAVOR_SYNC_INTERVAL || 3600000; // 1 hour default
  const syncEnabled = process.env.FLAVOR_SYNC_ENABLED === 'true';

  if (syncEnabled) {
    // Run flavor sync every hour (or custom interval)
    const intervalSeconds = Math.floor(syncInterval / 1000);
    const cronExpression = `*/${Math.min(intervalSeconds, 3600)}  * * * *`; // Max 1 hour

    console.log(`[ScheduledTasks] Setting up flavor sync task with interval: ${syncInterval}ms`);

    // Run immediately on startup
    console.log('[ScheduledTasks] Running initial flavor sync...');
    FlavorSyncService.syncFlavorsFromProductSystem()
      .then(() => console.log('[ScheduledTasks] Initial flavor sync completed'))
      .catch(err => console.error('[ScheduledTasks] Initial sync failed:', err.message));

    // Schedule periodic sync
    cron.schedule('0 * * * *', () => {
      console.log('[ScheduledTasks] Running scheduled flavor sync...');
      FlavorSyncService.syncFlavorsFromProductSystem()
        .then(() => console.log('[ScheduledTasks] Scheduled flavor sync completed'))
        .catch(err => console.error('[ScheduledTasks] Scheduled sync failed:', err.message));
    });
  }
}

export default setupScheduledTasks;
