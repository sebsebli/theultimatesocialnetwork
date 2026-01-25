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
      
      for (const action of actions) {
        try {
          // Execute the action
          await api.request(action.endpoint, {
            method: action.method,
            body: action.data ? JSON.stringify(action.data) : undefined,
          });
          
          // Remove from queue on success
          await removeQueuedAction(action.id);
        } catch (error) {
          console.error(`Failed to sync action ${action.id}:`, error);
          // Keep in queue for retry later
        }
      }
    } catch (error) {
      console.error('Failed to sync queued actions', error);
    }
  };

  return { syncQueuedActions };
}
