/**
 * First step for each agent: create a concrete persona from their character type.
 * The LLM generates displayName, handle, bio, and behavior; from this the profile is built.
 */

import OpenAI from 'openai';
import type { CharacterDef } from './characters.js';

export interface Persona {
  displayName: string;
  handle: string;
  bio: string;
  behavior: string;
}

const HANDLE_REGEX = /^[a-z0-9_]{2,30}$/;

function normalizeHandle(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 30) || 'user_' + Math.random().toString(36).slice(2, 8);
}

export async function createPersona(
  openai: OpenAI,
  model: string,
  character: CharacterDef,
  usedHandles: Set<string>,
): Promise<Persona> {
  const sys = `You create a concrete persona for a social reading network. The persona must fit the character type and feel like a real person.
Return ONLY valid JSON with exactly these keys (no markdown, no extra text):
- displayName: string (e.g. "Marcus Chen", "Elena Fisher")
- handle: string (lowercase letters, numbers, underscore only; 2–30 chars; e.g. "marcus_c", "elena_writes")
- bio: string (1–3 sentences for profile; fits the character)
- behavior: string (2–4 sentences describing how this person posts, replies, and interacts online; their tone and habits)`;

  const user = `Character type: ${character.label}.
Description: ${character.description}
Topics they care about: ${character.topics.join(', ')}

Create a unique persona. Pick a handle that is NOT in this list: ${Array.from(usedHandles).slice(-20).join(', ') || '(none)'}.
Return only the JSON object.`;

  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: user },
    ],
    // Omit temperature: some models (e.g. gpt-5-mini) only support default (1).
  });

  const content = response.choices?.[0]?.message?.content?.trim() ?? '';
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[0] : content;
  let parsed: { displayName?: string; handle?: string; bio?: string; behavior?: string };
  try {
    parsed = JSON.parse(jsonStr) as { displayName?: string; handle?: string; bio?: string; behavior?: string };
  } catch {
    parsed = {};
  }

  const handle = normalizeHandle(parsed.handle ?? character.type + '_' + Math.random().toString(36).slice(2, 6));
  const finalHandle = usedHandles.has(handle)
    ? handle + '_' + Math.random().toString(36).slice(2, 5)
    : handle;

  return {
    displayName: (parsed.displayName ?? character.label).slice(0, 100),
    handle: finalHandle,
    bio: (parsed.bio ?? character.description.slice(0, 200)).slice(0, 500),
    behavior: (parsed.behavior ?? character.description).slice(0, 600),
  };
}
