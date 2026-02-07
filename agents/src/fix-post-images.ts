#!/usr/bin/env node
/**
 * Add header images to all posts that are missing them.
 *
 * Strategy:
 *   1.  For each post, scan body text for theme keywords
 *   2.  Match to a hand-crafted Pixabay search query
 *   3.  Fall back to author-persona-based query
 *   4.  Download image, upload to API, PATCH post
 *
 * Pixabay rate limit: 100 req/min  →  we sleep 700ms between API searches
 * and cache image pools per query so identical queries only hit Pixabay once.
 */
import 'dotenv/config';

const API_URL = (process.env.CITE_API_URL || 'http://localhost/api').replace(/\/$/, '');
const ADMIN_KEY = process.env.CITE_ADMIN_SECRET!;
const PIXABAY_KEY = process.env.PIXABAY_API_KEY!;

if (!ADMIN_KEY) { console.error('Missing CITE_ADMIN_SECRET'); process.exit(1); }
if (!PIXABAY_KEY) { console.error('Missing PIXABAY_API_KEY'); process.exit(1); }

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ──────────────────────────────────────────────────────────────────────────────
// 1.  CONTENT  →  PIXABAY SEARCH QUERY MAPPING
//     Each entry: [array of body keywords to match, pixabay query]
//     First match wins, so order from specific → general.
// ──────────────────────────────────────────────────────────────────────────────

const KEYWORD_QUERIES: Array<[string[], string]> = [
  // ── Science & Tech ──
  [['quantum', 'particle', 'photon', 'entanglement'], 'quantum physics abstract light'],
  [['neuroscience', 'neurons', 'brain scan', 'synapses'], 'neuroscience brain scan medical'],
  [['climate', 'carbon', 'emissions', 'greenhouse'], 'climate change earth environment'],
  [['machine learning', 'neural network', 'deep learning'], 'artificial intelligence neural network'],
  [['algorithm', 'sorting', 'complexity'], 'code algorithm computer programming'],
  [['blockchain', 'crypto', 'bitcoin', 'ethereum'], 'blockchain cryptocurrency digital'],
  [['genome', 'dna', 'gene', 'crispr'], 'dna genome science laboratory'],
  [['telescope', 'galaxy', 'nebula', 'cosmos', 'star'], 'galaxy space telescope stars'],
  [['biology', 'cell', 'organism', 'evolution'], 'biology microscope cell science'],
  [['chemistry', 'molecule', 'reaction'], 'chemistry laboratory experiment science'],
  [['robotics', 'robot', 'automation'], 'robot technology automation modern'],
  [['satellite', 'orbit', 'spacecraft'], 'satellite space earth orbit'],
  [['solar panel', 'renewable', 'wind turbine', 'solar energy'], 'solar panel renewable energy green'],
  [['electric vehicle', 'ev ', 'tesla'], 'electric car modern technology'],
  [['cybersecurity', 'hacking', 'encryption', 'firewall'], 'cybersecurity lock digital code'],
  [['api', 'backend', 'server', 'microservice'], 'server room technology data center'],
  [['frontend', 'react', 'component', 'css', 'ui design'], 'web design code computer screen'],
  [['database', 'sql', 'postgres', 'query'], 'database server technology'],
  [['open source', 'github', 'repository', 'git'], 'code programming laptop developer'],
  [['typescript', 'javascript', 'python', 'rust lang'], 'programming code developer laptop'],
  [['startup', 'venture', 'funding', 'pitch'], 'startup business meeting modern'],
  [['product', 'roadmap', 'sprint', 'agile'], 'whiteboard planning team office'],
  [['remote work', 'work from home', 'distributed'], 'home office laptop remote work'],
  [['cloud computing', 'aws', 'docker', 'kubernetes'], 'cloud computing technology server'],

  // ── Reading, Writing, Literature ──
  [['novel', 'fiction', 'character', 'narrative', 'prose'], 'open book reading fiction literature'],
  [['poetry', 'poem', 'verse', 'stanza', 'haiku'], 'poetry writing pen paper artistic'],
  [['journal', 'notebook', 'diary', 'handwriting'], 'journal notebook pen handwriting'],
  [['library', 'shelves', 'archive', 'catalogue'], 'library books shelves reading'],
  [['bookstore', 'bookshop', 'paperback'], 'bookstore shelves cozy reading'],
  [['manuscript', 'editor', 'draft', 'revision'], 'manuscript paper editing writing'],
  [['reading', 'reader', 'bookworm'], 'person reading book comfortable'],
  [['footnote', 'citation', 'reference', 'bibliography'], 'research paper books desk academic'],
  [['essay', 'longform', 'long-form', 'argument'], 'typewriter writing essay desk'],

  // ── Philosophy & Ethics ──
  [['philosophy', 'existential', 'metaphysics', 'ontology'], 'philosophy books ancient library'],
  [['ethics', 'moral', 'dilemma', 'consent'], 'ethics balance scales justice'],
  [['stoic', 'marcus aurelius', 'epictetus', 'meditations'], 'ancient rome marble philosophy'],
  [['consciousness', 'awareness', 'sentience'], 'meditation mind abstract peaceful'],
  [['logic', 'reasoning', 'fallacy', 'argument'], 'logic puzzle thinking abstract'],

  // ── History & Culture ──
  [['history', 'historical', 'century', 'ancient', 'medieval'], 'history ancient ruins architecture'],
  [['mythology', 'myth', 'legend', 'folklore'], 'mythology ancient art painting'],
  [['archaeology', 'excavation', 'artifact', 'fossil'], 'archaeology excavation ancient ruins'],
  [['renaissance', 'baroque', 'classical art'], 'renaissance painting art museum'],
  [['colonial', 'empire', 'imperialism'], 'world map history colonial architecture'],

  // ── Music ──
  [['vinyl', 'record', 'turntable', 'analog'], 'vinyl record turntable music retro'],
  [['jazz', 'saxophone', 'improvisation', 'blues'], 'jazz saxophone concert music'],
  [['classical music', 'symphony', 'orchestra', 'piano'], 'piano classical music concert hall'],
  [['guitar', 'singer', 'songwriter', 'acoustic'], 'acoustic guitar music singer'],
  [['electronic music', 'synth', 'beat', 'producer'], 'music producer studio headphones'],
  [['music', 'melody', 'rhythm', 'harmony', 'sound'], 'music headphones listening audio'],

  // ── Visual Arts & Design ──
  [['painting', 'canvas', 'brush', 'palette', 'oil paint'], 'painting art canvas brush studio'],
  [['sculpture', 'marble', 'bronze', 'clay'], 'sculpture art marble studio'],
  [['photograph', 'camera', 'lens', 'exposure'], 'camera photography landscape photo'],
  [['film', 'cinema', 'director', 'scene', 'screenplay'], 'cinema film director camera'],
  [['architecture', 'building', 'facade', 'structure'], 'architecture modern building design'],
  [['interior design', 'furniture', 'decor'], 'interior design modern living room'],
  [['graphic design', 'typography', 'layout', 'poster'], 'graphic design typography modern'],
  [['illustration', 'sketch', 'drawing', 'pencil'], 'sketch drawing pencil artistic'],
  [['minimalism', 'minimalist', 'clean', 'simple'], 'minimalist design clean white space'],

  // ── Food & Cooking ──
  [['recipe', 'cooking', 'kitchen', 'ingredient'], 'cooking kitchen food preparation'],
  [['baking', 'sourdough', 'bread', 'pastry', 'dough'], 'fresh bread baking kitchen artisan'],
  [['ferment', 'kimchi', 'kombucha', 'pickle'], 'fermented food jars kitchen craft'],
  [['spice', 'curry', 'seasoning', 'flavor'], 'colorful spices cooking indian food'],
  [['coffee', 'espresso', 'latte', 'barista', 'brew'], 'coffee espresso barista cafe'],
  [['tea', 'matcha', 'ceremony', 'steep'], 'tea ceremony cup calm peaceful'],
  [['wine', 'vineyard', 'sommelier', 'tasting'], 'wine vineyard grapes sunlight'],
  [['restaurant', 'chef', 'cuisine', 'dish'], 'restaurant chef plating gourmet food'],
  [['street food', 'market', 'vendor', 'stall'], 'street food market vibrant culture'],

  // ── Nature & Environment ──
  [['forest', 'trees', 'woodland', 'canopy'], 'forest trees sunlight nature green'],
  [['ocean', 'sea', 'marine', 'coral', 'waves'], 'ocean waves sea marine nature'],
  [['mountain', 'summit', 'peak', 'alpine'], 'mountains landscape panoramic nature'],
  [['garden', 'plant', 'flower', 'bloom', 'seed'], 'garden flowers blooming nature colorful'],
  [['desert', 'dune', 'arid', 'cactus'], 'desert sand dunes landscape sunset'],
  [['river', 'stream', 'waterfall', 'creek'], 'river waterfall nature forest scenic'],
  [['wildlife', 'animal', 'species', 'habitat'], 'wildlife nature animal forest'],
  [['bird', 'migration', 'feather', 'nest'], 'bird nature wildlife tree colorful'],
  [['permaculture', 'compost', 'sustainable farm'], 'permaculture farm sustainable green'],

  // ── Health & Wellness ──
  [['yoga', 'meditation', 'mindful', 'breathe'], 'yoga meditation peaceful nature'],
  [['running', 'marathon', 'trail', 'mile'], 'running trail marathon nature fitness'],
  [['gym', 'weightlifting', 'strength', 'training'], 'gym fitness training strength exercise'],
  [['nutrition', 'diet', 'vitamin', 'protein'], 'healthy food nutrition colorful fresh'],
  [['mental health', 'therapy', 'anxiety', 'depression'], 'peaceful calm nature mental wellness'],
  [['sleep', 'dream', 'insomnia', 'circadian'], 'peaceful bedroom sleep night calm'],

  // ── Travel & Adventure ──
  [['travel', 'destination', 'passport', 'abroad'], 'travel landscape scenic adventure'],
  [['hiking', 'backpack', 'trail', 'trekking'], 'hiking mountain trail backpacking nature'],
  [['diving', 'snorkel', 'underwater', 'reef'], 'diving underwater coral reef ocean'],
  [['van life', 'camper', 'road trip', 'nomad'], 'campervan road trip sunset adventure'],
  [['city', 'urban', 'skyline', 'street'], 'city skyline urban architecture night'],
  [['airport', 'flight', 'airline'], 'airplane window clouds travel sky'],

  // ── Society & Politics ──
  [['journalism', 'press', 'media', 'reporter'], 'journalism newspaper press media'],
  [['democracy', 'vote', 'election', 'political'], 'democracy voting politics society'],
  [['human rights', 'justice', 'equality', 'freedom'], 'human rights protest justice society'],
  [['education', 'school', 'teacher', 'learning', 'classroom'], 'classroom education learning school'],
  [['economy', 'inflation', 'gdp', 'unemployment'], 'economy finance graph charts data'],
  [['poverty', 'inequality', 'wealth gap'], 'community diversity society urban'],
  [['privacy', 'surveillance', 'data privacy'], 'digital privacy security data lock'],
  [['free speech', 'censorship', 'expression'], 'microphone speech freedom press'],

  // ── Gaming ──
  [['game', 'gaming', 'esport', 'player', 'console'], 'gaming setup keyboard neon lights'],
  [['rpg', 'tabletop', 'dungeon', 'dice'], 'board game dice tabletop fantasy'],
  [['retro game', 'pixel', 'arcade', 'nintendo'], 'retro gaming arcade neon vintage'],

  // ── Crafts & Making ──
  [['woodwork', 'carpentry', 'lumber', 'saw'], 'woodworking workshop tools crafting'],
  [['knitting', 'crochet', 'yarn', 'textile'], 'knitting yarn craft colorful textile'],
  [['pottery', 'ceramic', 'kiln', 'glaze'], 'pottery ceramic hands crafting studio'],
  [['leather', 'craft', 'handmade', 'artisan'], 'artisan workshop handmade crafting'],
  [['restoration', 'repair', 'refurbish', 'vintage'], 'vintage restoration tools workshop'],

  // ── Finance & Business ──
  [['investing', 'portfolio', 'stock', 'index'], 'stock market finance investment chart'],
  [['personal finance', 'budget', 'saving'], 'personal finance money planning budget'],
  [['entrepreneur', 'business', 'founder'], 'entrepreneur business startup office'],
  [['marketing', 'brand', 'advertising'], 'marketing creative team office modern'],
  [['leadership', 'management', 'team'], 'leadership team meeting business'],

  // ── Family & Lifestyle ──
  [['parent', 'child', 'family', 'kid'], 'family happiness children nature park'],
  [['dog', 'puppy', 'canine', 'walk the dog'], 'dog walking park nature happy pet'],
  [['cat', 'kitten', 'feline', 'purr'], 'cat cozy home pet relaxed'],
  [['fashion', 'style', 'outfit', 'wardrobe'], 'fashion style modern urban clothing'],
  [['minimalist living', 'declutter', 'tidy'], 'minimalist living room clean modern'],
  [['vintage', 'antique', 'retro', 'thrift'], 'vintage objects antique market treasure'],

  // ── Communication & Language ──
  [['language', 'linguistic', 'grammar', 'syntax', 'translation'], 'language books dictionary learning'],
  [['bilingual', 'polyglot', 'multilingual'], 'travel languages cultural diversity'],
  [['podcast', 'episode', 'listener', 'audio'], 'podcast microphone recording studio'],
  [['comedy', 'humor', 'joke', 'standup'], 'comedy show stage lights microphone'],
  [['satire', 'irony', 'parody'], 'newspaper ink press editorial writing'],

  // ── Psychology ──
  [['psychology', 'cognitive', 'behavior', 'perception'], 'psychology brain abstract thinking'],
  [['memory', 'nostalgia', 'remember', 'forgot'], 'memory old photographs vintage sepia'],
  [['creativity', 'creative', 'imagination', 'inspiration'], 'creative workspace art inspiration colors'],
  [['habit', 'routine', 'discipline', 'consistency'], 'morning routine productive desk journal'],

  // ── Broad fallbacks ──
  [['digital', 'internet', 'online', 'screen'], 'technology digital screen modern abstract'],
  [['analog', 'tangible', 'physical', 'touch'], 'analog objects vintage warm nostalgic'],
  [['community', 'together', 'collective', 'shared'], 'community people together diverse'],
  [['silence', 'quiet', 'solitude', 'alone'], 'peaceful solitude nature morning light'],
  [['conversation', 'dialogue', 'discuss', 'debate'], 'two people talking cafe conversation'],
  [['time', 'patience', 'slow', 'waiting'], 'clock time peaceful vintage antique'],
  [['power', 'control', 'influence', 'authority'], 'abstract power light dramatic dark'],
  [['change', 'transform', 'transition', 'shift'], 'butterfly metamorphosis nature change'],
  [['curiosity', 'wonder', 'question', 'explore'], 'curious exploration compass adventure map'],
  [['connection', 'relationship', 'bond', 'link'], 'hands connection people together bond'],
  [['freedom', 'liberat', 'break free'], 'freedom sky open landscape peaceful'],
  [['identity', 'self', 'who am i', 'authentic'], 'mirror reflection abstract identity artistic'],
  [['tension', 'conflict', 'contrast', 'opposition'], 'abstract light shadow contrast dramatic'],
  [['universal', 'global', 'everywhere', 'humanity'], 'earth globe nature interconnected beauty'],
  [['future', 'tomorrow', 'next generation', 'vision'], 'futuristic city skyline modern glass'],
  [['past', 'heritage', 'tradition', 'ancestor'], 'heritage vintage old building historic'],
  [['balance', 'equilibrium', 'harmony'], 'zen stones balance peaceful water nature'],
  [['growth', 'grow', 'develop', 'flourish'], 'plant growing seedling green nature'],
  [['perspective', 'viewpoint', 'lens', 'angle'], 'aerial view landscape perspective nature'],
];

// ──────────────────────────────────────────────────────────────────────────────
// 2.  AUTHOR-BASED FALLBACK QUERIES  (landscape orientation)
// ──────────────────────────────────────────────────────────────────────────────

const AUTHOR_QUERIES: Record<string, string> = {
  'elias_v': 'vintage typewriter journal writing desk',
  'loretta_reads': 'books reading cozy library warm',
  'evelyn_v_reads': 'archive old books history library',
  'darius_active': 'running road morning sunrise fitness',
  'jordan_k_active': 'gym workout fitness equipment exercise',
  'kieran_h_music': 'music studio headphones producer',
  'bea_flips': 'creative art workshop colorful crafts',
  'sienna_in_vogue': 'fashion city street style modern',
  'torres_makes': 'woodworking workshop craftsmanship tools',
  'elena_writes': 'journalism newspaper press writing',
  'sam_ink': 'writing desk typewriter pen fiction',
  'maria_press': 'editor office modern professional desk',
  'david_byline': 'travel journalism landscape adventure',
  'nina_words': 'poetry pen paper artistic light',
  'alex_codes': 'code programming laptop developer screen',
  'priya_dev': 'woman engineer technology code screen',
  'marco_hack': 'cybersecurity terminal code dark',
  'luna_build': 'design ui creative workspace modern',
  'jake_stack': 'developer coffee code casual desk',
  'sara_data': 'data visualization chart science graph',
  'omar_web': 'web developer modern office workspace',
  'dr_neurons': 'brain neuroscience laboratory research',
  'prof_climate': 'climate earth environment science globe',
  'astro_kate': 'telescope stars galaxy astronomy night',
  'bio_maya': 'biology ocean research marine science',
  'quantum_li': 'physics quantum abstract science light',
  'iris_paints': 'painting canvas art colors studio',
  'oscar_lens': 'photography camera street urban',
  'yuki_design': 'minimalist design clean creative workspace',
  'zara_sculpts': 'sculpture art studio marble tools',
  'felix_films': 'cinema film camera director production',
  'beat_master': 'dj turntable music electronic neon',
  'classical_anna': 'piano concert classical music elegant',
  'indie_kai': 'guitar acoustic music coffee singer',
  'jazz_miles': 'jazz saxophone concert stage moody',
  'chef_ava': 'professional kitchen chef cooking gourmet',
  'spice_road': 'indian spices colorful cooking kitchen',
  'bake_house': 'bakery bread fresh pastry artisan',
  'ferment_lab': 'fermented food jars kitchen craft',
  'street_eats': 'street food market travel vibrant',
  'run_wild': 'trail running mountains nature sunrise',
  'yoga_grace': 'yoga meditation peaceful nature morning',
  'lift_heavy': 'gym weightlifting strength training',
  'dr_wellness': 'medical wellness healthy professional',
  'nomad_jules': 'travel laptop adventure digital nomad',
  'hike_north': 'hiking mountains wilderness trail scenic',
  'dive_deep': 'underwater diving ocean coral reef',
  'van_life': 'campervan road trip sunset adventure',
  'startup_nina': 'startup business modern office meeting',
  'vc_thoughts': 'finance investment modern business',
  'product_pm': 'whiteboard planning team modern office',
  'remote_work': 'home office laptop remote workspace',
  'teach_code': 'teaching classroom education learning',
  'learn_daily': 'books studying education library',
  'math_magic': 'mathematics equations blackboard classroom',
  'green_city': 'urban planning city architecture green',
  'ocean_guard': 'ocean beach conservation nature water',
  'farm_future': 'farm agriculture field sustainable green',
  'energy_now': 'renewable energy solar wind technology',
  'think_deep': 'philosophy books old library thinking',
  'history_nerd': 'history museum antique artifacts',
  'ethics_lab': 'academic research university books',
  'myth_tales': 'mythology ancient art storytelling',
  'pixel_quest': 'gaming retro arcade neon colorful',
  'esports_liv': 'esports gaming setup neon modern',
  'rpg_lore': 'tabletop game dice fantasy creative',
  'mom_real': 'family home warm cozy children',
  'dad_hacks': 'family outdoor fun playful park',
  'style_scout': 'fashion editorial modern style',
  'minimal_life': 'minimalist room clean modern simple',
  'vintage_hunt': 'vintage antique market treasure retro',
  'dog_walks': 'dog park walking nature happy',
  'cat_whiskers': 'cat cozy home warm relaxed pet',
  'wildlife_cam': 'wildlife nature photography animal safari',
  'market_sense': 'finance economics charts market data',
  'crypto_realist': 'cryptocurrency blockchain digital modern',
  'personal_fin': 'personal finance money planning office',
  'mind_matters': 'psychology mind therapy calm abstract',
  'brain_hacks': 'brain science research laboratory',
  'plant_parent': 'plants greenhouse garden indoor green',
  'wild_garden': 'garden nature permaculture outdoor green',
  'arch_lines': 'architecture building modern design city',
  'interior_mood': 'interior design modern home elegant',
  'pitch_side': 'football soccer stadium sport grass',
  'court_vision': 'basketball court sports action urban',
  'make_things': 'workshop tools crafting wood creative',
  'knit_purl': 'knitting yarn colorful cozy crafts',
  'rights_watch': 'justice courthouse law gavel legal',
  'policy_lens': 'government policy research analysis',
  'laugh_track': 'comedy stage spotlight microphone show',
  'satire_hour': 'newspaper editorial ink press writing',
  'word_nerd': 'linguistics books languages dictionary',
  'polyglot_life': 'travel languages cultural diversity maps',
  'fact_check': 'newspaper research journalism facts',
  'logic_gate': 'logic abstract science philosophy',
  'aid_field': 'humanitarian aid community diverse',
  'equity_now': 'community diversity teamwork together',
  'coffee_nerd': 'coffee beans roasting barista cafe',
  'space_fan': 'space nasa stars rocket universe',
  'board_games': 'board games strategy creative tabletop',
  'radio_waves': 'radio microphone studio broadcasting',
  'urban_sketch': 'sketching city urban architecture art',
  'tea_ceremony': 'tea ceremony japanese calm peaceful',
  'true_crime': 'detective investigation dark mystery',
  'solar_punk': 'solarpunk nature technology green future',
  'chloe_glows': 'skincare beauty routine self care',
  'hannah_walks': 'golden retriever dog walking park',
  'liam_restores': 'furniture restoration vintage workshop',
  'tariq_tastes': 'soul food cooking kitchen warm',
  'darius_crt': 'retro gaming crt screen neon glow',
};

// generic fallback if nothing else matches
const GENERIC_QUERIES = [
  'abstract colorful modern art',
  'nature landscape panoramic scenic',
  'books reading warm light',
  'cityscape urban architecture modern',
  'technology abstract digital art',
  'coffee cafe cozy morning',
  'creative workspace art inspiration',
  'peaceful nature sunrise morning',
  'abstract geometric modern design',
  'vintage retro warm nostalgic',
];

// ──────────────────────────────────────────────────────────────────────────────
// 3.  DETERMINE QUERY FOR A POST
// ──────────────────────────────────────────────────────────────────────────────

function queryForPost(body: string, authorHandle: string): string {
  const lower = body.toLowerCase();

  // Try keyword matches first (first match wins)
  for (const [keywords, query] of KEYWORD_QUERIES) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return query;
    }
  }

  // Author-based fallback
  if (AUTHOR_QUERIES[authorHandle]) return AUTHOR_QUERIES[authorHandle];

  // Generic random fallback
  return GENERIC_QUERIES[Math.floor(Math.random() * GENERIC_QUERIES.length)];
}

// ──────────────────────────────────────────────────────────────────────────────
// 4.  PIXABAY IMAGE POOL (cached per query)
// ──────────────────────────────────────────────────────────────────────────────

const imagePoolCache = new Map<string, Array<{ id: number; url: string }>>();
const usedImageIds = new Set<number>();
let pixabayCallCount = 0;

async function pixabaySearch(query: string, page = 1): Promise<Array<{ id: number; url: string }>> {
  pixabayCallCount++;
  const res = await fetch(
    `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=20&page=${page}&safesearch=true`,
  );
  if (!res.ok) {
    if (res.status === 429) {
      console.log('    [pixabay 429] waiting 30s...');
      await sleep(30000);
      return pixabaySearch(query, page);
    }
    console.log(`    [pixabay ${res.status}] for "${query}" p${page}`);
    return [];
  }
  const d = await res.json() as { hits: Array<{ id: number; webformatURL: string; largeImageURL: string }> };
  return (d.hits || []).map(h => ({ id: h.id, url: h.largeImageURL || h.webformatURL }));
}

async function getImage(query: string): Promise<string | null> {
  // Check cache first
  let pool = imagePoolCache.get(query);
  if (!pool) {
    pool = await pixabaySearch(query, 1);
    if (pool.length > 0) {
      // Also fetch page 2 for more variety
      await sleep(700);
      const page2 = await pixabaySearch(query, 2);
      pool = pool.concat(page2);
    }
    imagePoolCache.set(query, pool);
    await sleep(700); // respect rate limit
  }

  // Find an unused image
  for (const img of pool) {
    if (!usedImageIds.has(img.id)) {
      usedImageIds.add(img.id);
      return img.url;
    }
  }

  // If all used, try fetching more pages
  const currentPages = Math.ceil(pool.length / 20) + 1;
  for (let p = currentPages; p <= currentPages + 2; p++) {
    const more = await pixabaySearch(query, p);
    if (more.length === 0) break;
    pool.push(...more);
    imagePoolCache.set(query, pool);
    await sleep(700);
    for (const img of more) {
      if (!usedImageIds.has(img.id)) {
        usedImageIds.add(img.id);
        return img.url;
      }
    }
  }

  // Last resort: allow reuse
  if (pool.length > 0) {
    return pool[Math.floor(Math.random() * pool.length)].url;
  }
  return null;
}

// ──────────────────────────────────────────────────────────────────────────────
// 5.  API HELPERS
// ──────────────────────────────────────────────────────────────────────────────

async function adminCall<T = any>(path: string, opts?: { method?: string; body?: any }): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: opts?.method || 'GET',
    headers: {
      'X-Admin-Key': ADMIN_KEY,
      ...(opts?.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  });
  return res.json() as Promise<T>;
}

async function authCall<T = any>(path: string, token: string, opts?: { method?: string; body?: any }): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: opts?.method || 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(opts?.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  });
  return res.json() as Promise<T>;
}

async function uploadHeaderImage(token: string, imageUrl: string): Promise<{ key: string; blurhash?: string } | null> {
  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return null;
    const ab = await imgRes.arrayBuffer();
    const blob = new Blob([new Uint8Array(ab)], { type: 'image/jpeg' });
    const form = new FormData();
    form.append('image', blob, 'header.jpg');
    const upRes = await fetch(`${API_URL}/upload/header-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!upRes.ok) {
      console.log(`    [upload fail ${upRes.status}]`);
      return null;
    }
    return upRes.json() as Promise<{ key: string; blurhash?: string }>;
  } catch (e: any) {
    console.log(`    [upload error] ${e.message}`);
    return null;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 6.  MAIN
// ──────────────────────────────────────────────────────────────────────────────

interface PostRecord {
  id: string;
  authorHandle: string;
  body: string;
  topics: string[];
}

async function main() {
  console.log('=== Fix Post Header Images ===\n');

  // ── Step 1: Get all agents + tokens ──
  const agents = await adminCall<Array<{ email: string; handle: string }>>('/admin/agents');
  console.log(`Found ${agents.length} agents.`);

  const agentEmailByHandle = new Map<string, string>();
  for (const a of agents) agentEmailByHandle.set(a.handle, a.email);

  const tokenCache = new Map<string, string>();
  let tokensFetchedAt = Date.now();

  async function refreshAllTokens() {
    // Batch in parallel groups of 10 for speed
    const batchSize = 10;
    for (let i = 0; i < agents.length; i += batchSize) {
      const batch = agents.slice(i, i + batchSize);
      await Promise.all(batch.map(async (a) => {
        const { accessToken } = await adminCall<{ accessToken: string }>('/admin/agents/token', {
          method: 'POST',
          body: { email: a.email },
        });
        tokenCache.set(a.handle, accessToken);
      }));
    }
    tokensFetchedAt = Date.now();
  }

  async function getToken(handle: string): Promise<string> {
    // Refresh all tokens if older than 25 minutes (JWT typically lasts 30-60min)
    if (Date.now() - tokensFetchedAt > 25 * 60 * 1000) {
      console.log('  [refreshing all tokens...]');
      await refreshAllTokens();
      console.log('  [tokens refreshed]');
    }
    return tokenCache.get(handle)!;
  }

  async function refreshToken(handle: string): Promise<string> {
    const email = agentEmailByHandle.get(handle);
    if (!email) return '';
    const { accessToken } = await adminCall<{ accessToken: string }>('/admin/agents/token', {
      method: 'POST',
      body: { email },
    });
    tokenCache.set(handle, accessToken);
    return accessToken;
  }

  await refreshAllTokens();
  console.log(`Cached ${tokenCache.size} tokens.\n`);

  // ── Step 2: Collect ALL posts without images ──
  console.log('Scanning posts...');
  const postsToFix: PostRecord[] = [];
  let totalPosts = 0;
  let withImage = 0;

  for (const a of agents) {
    const token = tokenCache.get(a.handle)!;
    let page = 1;
    while (true) {
      const data = await authCall<{ items?: any[] }>(`/users/me/posts?type=posts&limit=100&page=${page}`, token);
      const posts: any[] = data.items || (Array.isArray(data) ? data : []);
      if (posts.length === 0) break;
      for (const p of posts) {
        totalPosts++;
        if (p.headerImageKey) {
          withImage++;
        } else {
          postsToFix.push({
            id: p.id,
            authorHandle: a.handle,
            body: (p.body || '').slice(0, 500),
            topics: (p.topics || []).map((t: any) => t.name || ''),
          });
        }
      }
      if (posts.length < 100) break;
      page++;
    }
  }

  console.log(`Total posts: ${totalPosts}`);
  console.log(`Already have images: ${withImage}`);
  console.log(`Need images: ${postsToFix.length}\n`);

  if (postsToFix.length === 0) {
    console.log('Nothing to fix!');
    return;
  }

  // ── Step 3: Pre-compute queries ──
  const queryMap = new Map<string, PostRecord[]>();
  for (const p of postsToFix) {
    const q = queryForPost(p.body, p.authorHandle);
    if (!queryMap.has(q)) queryMap.set(q, []);
    queryMap.get(q)!.push(p);
  }
  console.log(`Mapped to ${queryMap.size} unique Pixabay queries.`);
  // Show top queries
  const sorted = [...queryMap.entries()].sort((a, b) => b[1].length - a[1].length);
  for (const [q, posts] of sorted.slice(0, 15)) {
    console.log(`  "${q}" → ${posts.length} posts`);
  }
  console.log('');

  // ── Step 4: Pre-fetch image pools for all queries (most efficient) ──
  console.log('Pre-fetching Pixabay image pools...');
  const allQueries = [...queryMap.keys()];
  for (let i = 0; i < allQueries.length; i++) {
    const q = allQueries[i];
    if (!imagePoolCache.has(q)) {
      const pool = await pixabaySearch(q, 1);
      await sleep(700);
      if (pool.length > 0) {
        const page2 = await pixabaySearch(q, 2);
        pool.push(...page2);
        await sleep(700);
      }
      imagePoolCache.set(q, pool);
    }
    if ((i + 1) % 20 === 0) {
      console.log(`  Fetched ${i + 1}/${allQueries.length} queries (${pixabayCallCount} Pixabay calls)`);
    }
  }
  console.log(`  Done. ${pixabayCallCount} Pixabay API calls for ${allQueries.length} queries.\n`);

  // ── Step 5: Process posts ──
  let ok = 0;
  let fail = 0;
  const startTime = Date.now();

  for (let i = 0; i < postsToFix.length; i++) {
    const p = postsToFix[i];
    const query = queryForPost(p.body, p.authorHandle);
    let token = await getToken(p.authorHandle);
    if (!token) {
      console.log(`  [${i + 1}/${postsToFix.length}] @${p.authorHandle} — no token, skip`);
      fail++;
      continue;
    }

    // Get image
    const imageUrl = await getImage(query);
    if (!imageUrl) {
      console.log(`  [${i + 1}/${postsToFix.length}] ${p.id.slice(0, 8)} — no image for "${query}"`);
      fail++;
      continue;
    }

    // Upload (with retry on 401)
    let uploaded = await uploadHeaderImage(token, imageUrl);
    if (!uploaded) {
      // Maybe token expired — refresh and retry once
      token = await refreshToken(p.authorHandle);
      uploaded = await uploadHeaderImage(token, imageUrl);
      if (!uploaded) {
        fail++;
        continue;
      }
    }

    // Patch post (with retry on 401)
    const patchBody: any = { headerImageKey: uploaded.key };
    if (uploaded.blurhash) patchBody.headerImageBlurhash = uploaded.blurhash;

    let patchRes = await fetch(`${API_URL}/posts/${p.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(patchBody),
    });

    if (patchRes.status === 401) {
      token = await refreshToken(p.authorHandle);
      patchRes = await fetch(`${API_URL}/posts/${p.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(patchBody),
      });
    }

    if (!patchRes.ok) {
      console.log(`  [${i + 1}/${postsToFix.length}] ${p.id.slice(0, 8)} PATCH fail ${patchRes.status}`);
      fail++;
      continue;
    }

    ok++;
    if ((i + 1) % 25 === 0 || i === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      const rate = (ok / ((Date.now() - startTime) / 60000)).toFixed(1);
      console.log(`  [${i + 1}/${postsToFix.length}] ✓ ${ok} done, ${fail} fail | ${elapsed}s | ~${rate}/min | query="${query.slice(0, 40)}"`);
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(0);
  console.log(`\n=== DONE ===`);
  console.log(`Updated: ${ok} | Failed: ${fail} | Time: ${totalTime}s`);
  console.log(`Pixabay API calls: ${pixabayCallCount}`);
}

main().catch(e => { console.error(e); process.exit(1); });
