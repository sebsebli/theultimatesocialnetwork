/**
 * First step for each agent: create a concrete persona from their character type.
 * The LLM generates displayName, handle, bio, and behavior; from this the profile is built.
 */

import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
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
  openai: OpenAI | undefined,
  gemini: GoogleGenAI | undefined,
  model: string,
  character: CharacterDef,
  usedHandles: Set<string>,
  options: { usedDisplayNames?: Set<string> } = {},
): Promise<Persona> {
  const usedDisplayNames = options.usedDisplayNames ?? new Set<string>();
  const recentNames = Array.from(usedDisplayNames).slice(-25);
  const recentHandles = Array.from(usedHandles).slice(-20);

  const sys = `You create a concrete persona for a social reading network. The persona must fit the character type and feel like a real person. They will write realistic articles and posts about real-world topics—never about the platform or "being online".

**Names must be realistic and distinct:**
- displayName: A full name that sounds like a real person (e.g. "Marcus Chen", "Elena Fisher", "Yuki Tanaka", "Fatima Al-Hassan", "James O'Brien"). Vary styles and cultures—avoid generic or overused names. Do NOT pick a name that sounds similar to or starts with the same first name as names already in use.
- handle: lowercase letters, numbers, underscore only; 2–30 chars; must be unique and not in the used list.

Return ONLY valid JSON with exactly these keys (no markdown, no extra text):
- displayName: string (realistic full name; clearly different from any already-used names)
- handle: string (lowercase letters, numbers, underscore only; 2–30 chars; e.g. "marcus_c", "elena_writes")
- bio: string (one short sentence or a few words; max 160 characters; plain text only—no markdown)
- behavior: string (2–4 sentences: how this person writes and interacts; their tone and habits; the kinds of real-world topics they naturally write about, e.g. a chef might write about recipes and ingredients, a traveler about destinations—concrete themes that fit their type)`;

  const user = `Character type: ${character.label}.
Description: ${character.description}
Example topics/themes for this type: ${character.topics.join(', ')}

Create a unique persona. Give them concrete topics or themes they would naturally write about (fitting their type).
Already used display names (pick a clearly different name—different first name, not similar sounding): ${recentNames.length ? recentNames.join(', ') : '(none)'}.
Already used handles (pick one not in this list): ${recentHandles.length ? recentHandles.join(', ') : '(none)'}.
Return only the JSON object.`;

  let content = '';

  if (gemini) {
    const response = await gemini.models.generateContent({
      model,
      contents: user,
      config: {
        systemInstruction: sys,
        responseMimeType: 'application/json',
      },
    });
    content = response.text ?? '';
  } else if (openai) {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user },
      ],
    });
    content = response.choices?.[0]?.message?.content?.trim() ?? '';
  } else {
    throw new Error('No LLM client provided for persona creation');
  }

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
    bio: (parsed.bio ?? character.description.slice(0, 160)).slice(0, 160),
    behavior: (parsed.behavior ?? character.description).slice(0, 600),
  };
}

export interface RealPersonaResult {
  persona: Persona;
  character: CharacterDef;
  topics: string[];
}

/**
 * Ask the LLM to create one realistic social network persona (no fixed character type).
 * Returns persona + a synthetic CharacterDef so the agent loop can run the same way.
 */
export async function createRealSocialPersona(
  openai: OpenAI | undefined,
  gemini: GoogleGenAI | undefined,
  model: string,
  usedHandles: Set<string>,
  options: { usedDisplayNames?: Set<string> } = {},
): Promise<RealPersonaResult> {
  const usedDisplayNames = options.usedDisplayNames ?? new Set<string>();
  const recentNames = Array.from(usedDisplayNames).slice(-30);
  const recentHandles = Array.from(usedHandles).slice(-30);

  const sys = `You create ONE concrete, realistic social network persona—like a real person on Twitter, Instagram, or a reading app. They must feel like a distinct individual, not a generic type. Invent someone who could exist in the real world: varied professions, hobbies, and styles (e.g. a parent who posts about kids and recipes, a dev who shares code and hot takes, a journalist, a foodie, a hobbyist, a local activist, a book club lead, a fitness coach, a traveler, an artist, a skeptic, a mentor—anything). They will write realistic posts about real-world topics—never about "the platform" or "being online".

**Names must be realistic and distinct:**
- displayName: A full name that sounds like a real person (e.g. "Marcus Chen", "Elena Fisher", "Yuki Tanaka", "Fatima Al-Hassan"). Vary cultures and styles—avoid generic or overused names. Do NOT pick a name similar to or with the same first name as any already in use.
- handle: lowercase letters, numbers, underscore only; 2–30 chars; must be unique.

Return ONLY valid JSON with exactly these keys (no markdown, no extra text):
- displayName: string (realistic full name; clearly different from any already-used names)
- handle: string (lowercase letters, numbers, underscore only; 2–30 chars; e.g. "marcus_c", "elena_writes", "jamie_ob")
- bio: string (one short sentence or a few words; max 160 characters; plain text only—no markdown)
- behavior: string (2–4 sentences: how this person writes and interacts; their tone, habits, and the kinds of real-world topics they naturally post about)
- topics: string[] (3–6 concrete topics or themes they post about, e.g. ["sourdough", "parenting", "weekend hikes", "minimalism"])
- label: string (short archetype, e.g. "Food blogger", "Tech commentator", "Parent blogger", "Travel photographer")`;

  const user = `Create one unique, realistic social network persona. Make them feel like a real person with specific interests and voice.
Already used display names (pick a clearly different name—different first name, not similar): ${recentNames.length ? recentNames.join(', ') : '(none)'}.
Already used handles (pick one not in this list): ${recentHandles.length ? recentHandles.join(', ') : '(none)'}.
Return only the JSON object.`;

  let content = '';

  if (gemini) {
    const response = await gemini.models.generateContent({
      model,
      contents: user,
      config: {
        systemInstruction: sys,
        responseMimeType: 'application/json',
      },
    });
    content = response.text ?? '';
  } else if (openai) {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user },
      ],
    });
    content = response.choices?.[0]?.message?.content?.trim() ?? '';
  } else {
    throw new Error('No LLM client provided for persona creation');
  }

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[0] : content;
  let parsed: {
    displayName?: string;
    handle?: string;
    bio?: string;
    behavior?: string;
    topics?: string[];
    label?: string;
  };
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    parsed = {};
  }

  const rawTopics = Array.isArray(parsed.topics) ? parsed.topics : [];
  const topics = rawTopics.filter((t): t is string => typeof t === 'string').slice(0, 8);

  const handle = normalizeHandle(parsed.handle ?? 'user_' + Math.random().toString(36).slice(2, 8));
  const finalHandle = usedHandles.has(handle)
    ? handle + '_' + Math.random().toString(36).slice(2, 5)
    : handle;

  const persona: Persona = {
    displayName: (parsed.displayName ?? parsed.label ?? 'User').slice(0, 100),
    handle: finalHandle,
    bio: (parsed.bio ?? 'Real person on the internet.').slice(0, 160),
    behavior: (parsed.behavior ?? '').slice(0, 600),
  };

  const character: CharacterDef = {
    type: 'custom',
    label: (parsed.label ?? persona.displayName).slice(0, 80),
    description: [persona.bio, persona.behavior].filter(Boolean).join(' ').slice(0, 500) || 'Real social network persona.',
    postBias: 0.45,
    replyBias: 0.35,
    interactBias: 0.2,
    topics: topics.length > 0 ? topics : ['personal', 'interests', 'daily life'],
    avatarQuery: 'person portrait',
    headerQuery: 'lifestyle',
  };

  return { persona, character, topics };
}
