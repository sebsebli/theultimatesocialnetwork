import * as FileSystem from 'expo-file-system';

interface QueuedAction {
  id: string;
  type: 'like' | 'keep' | 'follow' | 'reply' | 'quote' | 'post' | 'report';
  endpoint: string;
  method: 'POST' | 'DELETE' | 'PUT' | 'PATCH';
  data?: any;
  timestamp: number;
}

const QUEUE_FILE = FileSystem.documentDirectory + 'offline_action_queue.json';

export async function queueAction(action: Omit<QueuedAction, 'id' | 'timestamp'>): Promise<void> {
  try {
    const existing = await getQueuedActions();
    const newAction: QueuedAction = {
      ...action,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };
    await FileSystem.writeAsStringAsync(QUEUE_FILE, JSON.stringify([...existing, newAction]));
  } catch (error) {
    // Fail silently in production or report to crashlytics
  }
}

export async function getQueuedActions(): Promise<QueuedAction[]> {
  try {
    const info = await FileSystem.getInfoAsync(QUEUE_FILE);
    if (!info.exists) return [];
    
    const data = await FileSystem.readAsStringAsync(QUEUE_FILE);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
}

export async function clearQueuedActions(): Promise<void> {
  try {
    await FileSystem.deleteAsync(QUEUE_FILE, { idempotent: true });
  } catch (error) {
    // ignore
  }
}

export async function removeQueuedAction(actionId: string): Promise<void> {
  try {
    const actions = await getQueuedActions();
    const filtered = actions.filter(a => a.id !== actionId);
    await FileSystem.writeAsStringAsync(QUEUE_FILE, JSON.stringify(filtered));
  } catch (error) {
    // ignore
  }
}