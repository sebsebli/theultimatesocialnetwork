import { File, Paths } from 'expo-file-system';

interface QueuedAction {
  id: string;
  type: 'like' | 'keep' | 'follow' | 'reply' | 'quote' | 'post' | 'report';
  endpoint: string;
  method: 'POST' | 'DELETE' | 'PUT' | 'PATCH';
  data?: any;
  timestamp: number;
}

const QUEUE_FILE = new File(Paths.document, 'offline_action_queue.json');

export async function queueAction(action: Omit<QueuedAction, 'id' | 'timestamp'>): Promise<void> {
  try {
    const existing = await getQueuedActions();
    const newAction: QueuedAction = {
      ...action,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };
    QUEUE_FILE.create({ overwrite: true });
    QUEUE_FILE.write(JSON.stringify([...existing, newAction]));
  } catch (error) {
    // Fail silently in production or report to crashlytics
  }
}

export async function getQueuedActions(): Promise<QueuedAction[]> {
  try {
    if (!QUEUE_FILE.exists) return [];
    const data = await QUEUE_FILE.text();
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
}

export async function clearQueuedActions(): Promise<void> {
  try {
    if (QUEUE_FILE.exists) QUEUE_FILE.delete();
  } catch (error) {
    // ignore
  }
}

export async function removeQueuedAction(actionId: string): Promise<void> {
  try {
    const actions = await getQueuedActions();
    const filtered = actions.filter(a => a.id !== actionId);
    QUEUE_FILE.create({ overwrite: true });
    QUEUE_FILE.write(JSON.stringify(filtered));
  } catch (error) {
    // ignore
  }
}