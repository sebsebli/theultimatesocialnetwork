#!/usr/bin/env node
/**
 * Replace all agent profile photos with unique Pixabay images.
 * Each search query was manually crafted to match the user's persona.
 * Uses Pixabay (not Pexels — Pexels is rate-limited from earlier runs).
 */
import 'dotenv/config';

const API_URL = (process.env.CITE_API_URL || 'http://localhost/api').replace(/\/$/, '');
const ADMIN_KEY = process.env.CITE_ADMIN_SECRET!;
const PIXABAY_KEY = process.env.PIXABAY_API_KEY!;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const usedIds = new Set<number>();

// ─── Hand-crafted search queries per user ───────────────────────────────────
const QUERIES: Record<string, string> = {
  'elias_v': 'man writing cafe portrait',
  'loretta_reads': 'woman reading book glasses',
  'evelyn_v_reads': 'woman historian academic portrait',
  'darius_active': 'man running fitness athlete',
  'jordan_k_active': 'man gym workout portrait',
  'kieran_h_music': 'man musician headphones portrait',
  'bea_flips': 'woman creative workshop smiling',
  'sienna_in_vogue': 'woman fashion city stylish',
  'torres_makes': 'man woodworking craftsman workshop',
  'elena_writes': 'woman journalist professional writing',
  'sam_ink': 'man writer author portrait desk',
  'maria_press': 'woman editor professional elegant',
  'david_byline': 'man journalist travel correspondent',
  'nina_words': 'woman poet blonde artistic',
  'alex_codes': 'man developer laptop coding',
  'priya_dev': 'woman engineer technology office',
  'marco_hack': 'man cybersecurity professional',
  'luna_build': 'woman designer creative workspace',
  'jake_stack': 'man engineer coffee casual',
  'sara_data': 'woman scientist data professional',
  'omar_web': 'man developer modern office',
  'dr_neurons': 'woman scientist laboratory neuroscience',
  'prof_climate': 'man professor lecture academic',
  'astro_kate': 'woman astronomer telescope stars',
  'bio_maya': 'woman biologist ocean research',
  'quantum_li': 'man physicist researcher academic',
  'iris_paints': 'woman artist painting studio',
  'oscar_lens': 'man photographer camera street',
  'yuki_design': 'woman designer minimalist creative',
  'zara_sculpts': 'woman sculptor art studio',
  'felix_films': 'man filmmaker camera director',
  'beat_master': 'man dj turntable music producer',
  'classical_anna': 'woman pianist classical music concert',
  'indie_kai': 'man guitar singer songwriter',
  'jazz_miles': 'man saxophone jazz musician',
  'chef_ava': 'woman chef kitchen professional cooking',
  'spice_road': 'man cooking indian spices kitchen',
  'bake_house': 'woman baker bread pastry flour',
  'ferment_lab': 'man chef asian kitchen apron',
  'street_eats': 'woman food market travel journalist',
  'run_wild': 'man runner trail marathon mountains',
  'yoga_grace': 'woman yoga meditation peaceful',
  'lift_heavy': 'man weightlifting gym muscular trainer',
  'dr_wellness': 'woman doctor medical professional',
  'nomad_jules': 'man travel laptop backpacker',
  'hike_north': 'man hiking mountains wilderness',
  'dive_deep': 'woman diving ocean snorkel',
  'van_life': 'person campervan adventure sunset',
  'startup_nina': 'woman business founder entrepreneur',
  'vc_thoughts': 'man business suit investor',
  'product_pm': 'woman professional office whiteboard',
  'remote_work': 'man laptop remote work home',
  'teach_code': 'woman professor teaching classroom',
  'learn_daily': 'man student books studying',
  'math_magic': 'woman teacher classroom chalkboard',
  'green_city': 'man architect city urban planning',
  'ocean_guard': 'woman beach ocean conservation',
  'farm_future': 'man farmer field agriculture',
  'energy_now': 'woman engineer solar energy',
  'think_deep': 'man professor philosopher distinguished',
  'history_nerd': 'woman books antique historian',
  'ethics_lab': 'man academic research professor',
  'myth_tales': 'woman storyteller bohemian creative',
  'pixel_quest': 'man gamer gaming retro',
  'esports_liv': 'woman gamer esports headset',
  'rpg_lore': 'man tabletop board games creative',
  'mom_real': 'woman mother family warm smile',
  'dad_hacks': 'man father family playful',
  'style_scout': 'woman fashion editorial elegant',
  'minimal_life': 'man minimalist simple modern portrait',
  'vintage_hunt': 'woman vintage retro style',
  'dog_walks': 'man dog trainer outdoors pet',
  'cat_whiskers': 'woman cat pet portrait feline',
  'wildlife_cam': 'man wildlife photographer safari',
  'market_sense': 'woman economist finance professional',
  'crypto_realist': 'man tech startup cryptocurrency',
  'personal_fin': 'woman financial advisor professional',
  'mind_matters': 'woman psychologist therapist portrait',
  'brain_hacks': 'woman scientist research young',
  'plant_parent': 'man plants greenhouse garden',
  'wild_garden': 'woman gardening outdoor permaculture',
  'arch_lines': 'man architect blueprint building',
  'interior_mood': 'woman interior designer elegant home',
  'pitch_side': 'man football soccer analyst',
  'court_vision': 'woman basketball sports journalist',
  'make_things': 'woman woodworker tools workshop',
  'knit_purl': 'woman knitting yarn crafts cozy',
  'rights_watch': 'man lawyer suit professional justice',
  'policy_lens': 'woman researcher government policy',
  'laugh_track': 'man comedian stage microphone',
  'satire_hour': 'woman writer sharp witty portrait',
  'word_nerd': 'man professor linguist books',
  'polyglot_life': 'woman multilingual traveler portrait',
  'fact_check': 'man journalist glasses newspaper',
  'logic_gate': 'woman philosopher science university',
  'aid_field': 'man humanitarian aid worker field',
  'equity_now': 'woman community leader entrepreneur',
  'coffee_nerd': 'man barista coffee roaster cafe',
  'space_fan': 'woman space science nasa enthusiast',
  'board_games': 'man board games strategy creative',
  'radio_waves': 'woman radio dj headphones studio',
  'urban_sketch': 'man artist sketching city urban',
  'tea_ceremony': 'man tea ceremony japanese traditional',
  'true_crime': 'woman podcast microphone research',
  'solar_punk': 'woman creative futuristic nature optimistic',
  'chloe_glows': 'woman skincare beauty routine glowing',
  'hannah_walks': 'woman golden retriever dog walking',
  'liam_restores': 'man furniture restoration vintage wood',
  'tariq_tastes': 'man chef soul food cooking',
  'darius_crt': 'man gamer gaming setup headset',
};

// ─── Pixabay fetch ──────────────────────────────────────────────────────────
async function pixabayFetch(query: string, page = 1): Promise<Array<{ id: number; url: string }>> {
  const res = await fetch(
    `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&image_type=photo&orientation=vertical&per_page=10&page=${page}&safesearch=true`,
  );
  if (!res.ok) {
    if (res.status === 429) {
      console.log('    [pixabay rate limit] waiting 30s...');
      await sleep(30000);
      return pixabayFetch(query, page);
    }
    return [];
  }
  const d = await res.json() as { hits: Array<{ id: number; webformatURL: string; largeImageURL: string }> };
  return (d.hits || []).map(h => ({ id: h.id, url: h.largeImageURL || h.webformatURL }));
}

async function getUniquePhoto(query: string): Promise<string | null> {
  for (let page = 1; page <= 3; page++) {
    const photos = await pixabayFetch(query, page);
    for (const p of photos) {
      if (!usedIds.has(p.id)) {
        usedIds.add(p.id);
        return p.url;
      }
    }
    await sleep(500);
  }
  return null;
}

// ─── Upload helper ──────────────────────────────────────────────────────────
async function uploadProfilePic(token: string, imageUrl: string): Promise<string | null> {
  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return null;
    const ab = await imgRes.arrayBuffer();
    const blob = new Blob([new Uint8Array(ab)], { type: 'image/jpeg' });
    const form = new FormData();
    form.append('image', blob, 'profile.jpg');
    const upRes = await fetch(`${API_URL}/upload/profile-picture`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!upRes.ok) return null;
    const data = await upRes.json() as { key: string };
    return data.key;
  } catch { return null; }
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const res = await fetch(`${API_URL}/admin/agents`, { headers: { 'X-Admin-Key': ADMIN_KEY } });
  const agents = await res.json() as Array<{ email: string; handle: string; displayName: string }>;
  console.log(`Found ${agents.length} agents.\n`);

  let ok = 0, fail = 0;

  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i];
    const query = QUERIES[agent.handle];
    if (!query) {
      console.log(`  [${i + 1}/${agents.length}] @${agent.handle} — no query, skip`);
      fail++;
      continue;
    }

    // Auth
    const tokRes = await fetch(`${API_URL}/admin/agents/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': ADMIN_KEY },
      body: JSON.stringify({ email: agent.email }),
    });
    if (!tokRes.ok) { console.log(`  [${i + 1}] @${agent.handle} — auth fail`); fail++; continue; }
    const { accessToken } = await tokRes.json() as { accessToken: string };

    // Find unique photo
    const photoUrl = await getUniquePhoto(query);
    if (!photoUrl) {
      console.log(`  [${i + 1}/${agents.length}] @${agent.handle} — no photo for "${query}"`);
      fail++;
      continue;
    }

    // Upload
    const key = await uploadProfilePic(accessToken, photoUrl);
    if (!key) { console.log(`  [${i + 1}] @${agent.handle} — upload fail`); fail++; continue; }

    // Update
    const pRes = await fetch(`${API_URL}/users/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ avatarKey: key }),
    });
    if (!pRes.ok) { console.log(`  [${i + 1}] @${agent.handle} — patch fail`); fail++; continue; }

    ok++;
    console.log(`  [${i + 1}/${agents.length}] @${agent.handle} ✓ "${query}"`);

    // Be gentle with Pixabay (100 req/min limit)
    await sleep(1200);
  }

  console.log(`\nDone. Updated: ${ok}, Failed: ${fail}`);
}

main().catch(e => { console.error(e); process.exit(1); });
