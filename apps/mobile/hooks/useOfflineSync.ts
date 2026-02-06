import { useEffect } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { getQueuedActions, removeQueuedAction } from '../utils/offlineQueue';
import { api } from '../utils/api';

export function useOfflineSync() {
  const { isOffline } = useNetworkStatus();

  useEffect(() => {
    if (!isOffline) {
      // When coming back online, sync queued actions
      syncQueuedActions();
    }
  }, [isOffline]);

  const syncQueuedActions = async () => {
    try {
      const actions = await getQueuedActions();
      if (actions.length === 0) return;

      // console.log(`Syncing ${actions.length} offline actions...`);
      
      for (const action of actions) {
        try {
          // Execute the action
          await api.request(action.endpoint, {
            method: action.method,
            body: action.data ? JSON.stringify(action.data) : undefined,
          });
          
          // Remove from queue on success
          await removeQueuedAction(action.id);
        } catch (error: unknown) {
          // If the error is 4xx (client error), it's unlikely to succeed on retry — remove it.
          const status = (error as { status?: number })?.status;
          if (status && status >= 400 && status < 500) {
             await removeQueuedAction(action.id);
          }
          // Otherwise keep in queue for retry later when network is better
        }
      }
    } catch (error) {
      // console.error('Failed to sync queued actions', error);
    }
  };

  return { syncQueuedActions };
}