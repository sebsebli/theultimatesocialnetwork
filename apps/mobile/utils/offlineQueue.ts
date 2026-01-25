import * as SecureStore from 'expo-secure-store';

interface QueuedAction {
  id: string;
  type: 'like' | 'keep' | 'follow' | 'reply' | 'quote' | 'post' | 'report';
  endpoint: string;
  method: 'POST' | 'DELETE' | 'PUT' | 'PATCH';
  data?: any;
  timestamp: number;
}

const QUEUE_KEY = 'offline_action_queue';

export async function queueAction(action: Omit<QueuedAction, 'id' | 'timestamp'>): Promise<void> {
  try {
    const existing = await getQueuedActions();
    const newAction: QueuedAction = {
      ...action,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };
    await SecureStore.setItemAsync(QUEUE_KEY, JSON.stringify([...existing, newAction]));
  } catch (error) {
    console.error('Failed to queue action', error);
  }
}

export async function getQueuedActions(): Promise<QueuedAction[]> {
  try {
    const data = await SecureStore.getItemAsync(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get queued actions', error);
    return [];
  }
}

export async function clearQueuedActions(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(QUEUE_KEY);
  } catch (error) {
    console.error('Failed to clear queued actions', error);
  }
}

export async function removeQueuedAction(actionId: string): Promise<void> {
  try {
    const actions = await getQueuedActions();
    const filtered = actions.filter(a => a.id !== actionId);
    await SecureStore.setItemAsync(QUEUE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove queued action', error);
  }
}
