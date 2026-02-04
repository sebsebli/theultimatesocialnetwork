/**
 * Optional persistence for personas so they can continue next time (--resume).
 * Stored file contains characterType, profile fields, and email for re-auth.
 */

import type { CharacterType } from './characters.js';

export interface StoredPersona {
  characterType: CharacterType;
  displayName: string;
  handle: string;
  bio: string;
  behavior: string;
  email: string;
  /** When this persona was first created (ISO string). */
  createdAt?: string;
  /** For custom/real personas: topics they post about (used when resuming). */
  topics?: string[];
}

const DEFAULT_PATH = 'data/personas.json';

export function getPersonasFilePath(customPath?: string): string {
  return customPath ?? DEFAULT_PATH;
}

/** Load personas from JSON file. Returns [] if file missing or invalid. */
export async function loadPersonas(filePath: string): Promise<StoredPersona[]> {
  const fs = await import('fs/promises');
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(raw) as { personas?: StoredPersona[]; createdAt?: string };
    const list = Array.isArray(data.personas) ? data.personas : Array.isArray(data) ? (data as unknown as StoredPersona[]) : [];
    return list.filter(
      (p) =>
        p &&
        typeof p.characterType === 'string' &&
        typeof p.handle === 'string' &&
        typeof p.email === 'string',
    ) as StoredPersona[];
  } catch {
    return [];
  }
}

/** Save personas to JSON file. Creates parent directory if needed. */
export async function savePersonas(
  filePath: string,
  personas: StoredPersona[],
): Promise<void> {
  const fs = await import('fs/promises');
  const dir = filePath.replace(/\/[^/]+$/, '');
  if (dir && dir !== filePath) {
    await fs.mkdir(dir, { recursive: true });
  }
  const payload = {
    personas,
    createdAt: new Date().toISOString(),
    note: 'Used with npm run run -- --resume to continue these agents.',
  };
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf-8');
}
