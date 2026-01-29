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
        } catch (error: any) {
          // console.error(`Failed to sync action ${action.id}:`, error);
          
          // If the error is 400 (Bad Request) or 404 (Not Found), 
          // it's unlikely to succeed on retry, so we remove it.
          if (error?.status >= 400 && error?.status < 500) {
             // console.warn(`Action ${action.id} failed with non-retryable error ${error.status}. Removing from queue.`);
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