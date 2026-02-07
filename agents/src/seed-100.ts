#!/usr/bin/env node
/**
 * Seed 100 realistic users with rich content: posts, replies, follows, likes, citations, external links.
 * Uses admin API for user creation and standard API for content creation.
 * No LLM needed — all content is pre-generated for speed and reliability.
 *
 * Usage: cd agents && npx tsx src/seed-100.ts
 */
import 'dotenv/config';

// ─── Config ─────────────────────────────────────────────────────────────────
const API_URL = (process.env.CITE_API_URL || 'http://localhost/api').replace(/\/$/, '');
const ADMIN_KEY = process.env.CITE_ADMIN_SECRET || 'dev-admin-change-me';

// ─── Helpers ────────────────────────────────────────────────────────────────
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[rand(0, arr.length - 1)];
const pickN = <T>(arr: T[], n: number): T[] => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
};
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ─── API wrappers ───────────────────────────────────────────────────────────
async function adminPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Key': ADMIN_KEY },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`POST ${path}: ${res.status} ${text}`);
  return text ? JSON.parse(text) : undefined;
}

async function authPost<T>(path: string, body: Record<string, unknown>, token: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`POST ${path}: ${res.status} ${text}`);
  return text ? JSON.parse(text) : undefined;
}

async function authGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`GET ${path}: ${res.status} ${text}`);
  return text ? JSON.parse(text) : undefined;
}

// ─── Upload helper ──────────────────────────────────────────────────────────
async function uploadAvatar(token: string, handle: string): Promise<string | null> {
  try {
    const imgUrl = `https://api.dicebear.com/9.x/notionists/png?seed=${encodeURIComponent(handle)}&size=200`;
    const imgRes = await fetch(imgUrl);
    if (!imgRes.ok) return null;
    const ab = await imgRes.arrayBuffer();
    const blob = new Blob([new Uint8Array(ab)], { type: 'image/png' });
    const form = new FormData();
    form.append('image', blob, `avatar-${handle}.png`);
    const uploadRes = await fetch(`${API_URL}/upload/profile-picture`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!uploadRes.ok) return null;
    const data = await uploadRes.json() as { key: string };
    return data.key;
  } catch {
    return null;
  }
}

async function uploadHeaderImage(token: string, seed: string): Promise<string | null> {
  try {
    const imgUrl = `https://picsum.photos/seed/${encodeURIComponent(seed)}/1200/600`;
    const imgRes = await fetch(imgUrl);
    if (!imgRes.ok) return null;
    const ab = await imgRes.arrayBuffer();
    const blob = new Blob([new Uint8Array(ab)], { type: 'image/jpeg' });
    const form = new FormData();
    form.append('image', blob, 'header.jpg');
    const uploadRes = await fetch(`${API_URL}/upload/header-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!uploadRes.ok) return null;
    const data = await uploadRes.json() as { key: string };
    return data.key;
  } catch {
    return null;
  }
}

// ─── User state ─────────────────────────────────────────────────────────────
interface UserState {
  id: string;
  handle: string;
  displayName: string;
  token: string;
  email: string;
}

const allUsers: UserState[] = [];
const allPostIds: string[] = [];

// ─── 100 Diverse personas ──────────────────────────────────────────────────
const PERSONAS: Array<{
  handle: string;
  displayName: string;
  bio: string;
  topics: string[];
}> = [
    // Journalists & writers
    { handle: 'elena_writes', displayName: 'Elena Marchetti', bio: 'Investigative journalist. Long-form essays on politics, media, and power.', topics: ['Journalism', 'Media', 'Politics'] },
    { handle: 'sam_ink', displayName: 'Samuel Okafor', bio: 'Fiction writer & essayist. Exploring the human condition one story at a time.', topics: ['Literature', 'Fiction', 'Writing'] },
    { handle: 'maria_press', displayName: 'Maria Chen', bio: 'Senior editor at a literary magazine. Book reviews, publishing insights.', topics: ['Publishing', 'Books', 'Literature'] },
    { handle: 'david_byline', displayName: 'David Kowalski', bio: 'Foreign correspondent. War zones to coffee shops—always looking for the story.', topics: ['Journalism', 'Travel', 'Conflict'] },
    { handle: 'nina_words', displayName: 'Nina Johansson', bio: 'Poet and translator. Swedish-English. Words are bridges.', topics: ['Poetry', 'Translation', 'Language'] },

    // Tech & developers
    { handle: 'alex_codes', displayName: 'Alex Rivera', bio: 'Full-stack dev. Building tools that matter. Open source advocate.', topics: ['Technology', 'Programming', 'Open Source'] },
    { handle: 'priya_dev', displayName: 'Priya Sharma', bio: 'ML engineer at a startup. Making AI less scary, one explanation at a time.', topics: ['AI', 'Machine Learning', 'Technology'] },
    { handle: 'marco_hack', displayName: 'Marco Rossi', bio: 'Security researcher. Breaking things to make them safer.', topics: ['Cybersecurity', 'Privacy', 'Technology'] },
    { handle: 'luna_build', displayName: 'Luna Park', bio: 'iOS developer and design nerd. Pixels matter.', topics: ['Design', 'iOS', 'UX'] },
    { handle: 'jake_stack', displayName: 'Jake Thompson', bio: 'DevOps engineer. Infrastructure as code, coffee as fuel.', topics: ['DevOps', 'Cloud', 'Infrastructure'] },
    { handle: 'sara_data', displayName: 'Sara Eriksson', bio: 'Data scientist. Turning numbers into narratives. Python & R.', topics: ['Data Science', 'Statistics', 'Python'] },
    { handle: 'omar_web', displayName: 'Omar Hassan', bio: 'Frontend engineer. CSS is my love language. Accessibility first.', topics: ['Web Development', 'CSS', 'Accessibility'] },

    // Science & academia
    { handle: 'dr_neurons', displayName: 'Dr. Amelia Frost', bio: 'Neuroscientist studying memory and consciousness. Science communicator.', topics: ['Neuroscience', 'Science', 'Brain'] },
    { handle: 'prof_climate', displayName: 'Prof. James Okonkwo', bio: 'Climate scientist. The data is clear—now we need action.', topics: ['Climate', 'Environment', 'Science'] },
    { handle: 'astro_kate', displayName: 'Kate Novak', bio: 'Astrophysicist and stargazer. The universe is stranger than fiction.', topics: ['Astronomy', 'Physics', 'Space'] },
    { handle: 'bio_maya', displayName: 'Maya Petrov', bio: 'Marine biologist. Oceans are the last frontier. Conservation matters.', topics: ['Marine Biology', 'Oceans', 'Conservation'] },
    { handle: 'quantum_li', displayName: 'Dr. Wei Li', bio: 'Quantum computing researcher. Superposition: both excited and confused.', topics: ['Quantum Computing', 'Physics', 'Technology'] },

    // Arts & creativity
    { handle: 'iris_paints', displayName: 'Iris Dubois', bio: 'Oil painter and gallery curator. Art is how we process the world.', topics: ['Art', 'Painting', 'Gallery'] },
    { handle: 'oscar_lens', displayName: 'Oscar Medina', bio: 'Street photographer. Finding beauty in the ordinary.', topics: ['Photography', 'Street', 'Visual'] },
    { handle: 'yuki_design', displayName: 'Yuki Tanaka', bio: 'Graphic designer. Minimalism is not emptiness—it\'s precision.', topics: ['Design', 'Typography', 'Minimalism'] },
    { handle: 'zara_sculpts', displayName: 'Zara Mbeki', bio: 'Sculptor working in bronze and reclaimed materials. Art meets ecology.', topics: ['Sculpture', 'Art', 'Ecology'] },
    { handle: 'felix_films', displayName: 'Felix Bergström', bio: 'Indie filmmaker. Stories that wouldn\'t exist otherwise.', topics: ['Film', 'Cinema', 'Storytelling'] },

    // Music
    { handle: 'beat_master', displayName: 'Damon Cole', bio: 'Producer and DJ. Electronic music, vinyl culture, late nights.', topics: ['Music', 'Electronic', 'Production'] },
    { handle: 'classical_anna', displayName: 'Anna Sokolov', bio: 'Concert pianist. Bach to Bartók. Teaching music theory online.', topics: ['Classical Music', 'Piano', 'Music Theory'] },
    { handle: 'indie_kai', displayName: 'Kai Morrison', bio: 'Singer-songwriter. Indie folk with a touch of melancholy.', topics: ['Indie Music', 'Songwriting', 'Folk'] },
    { handle: 'jazz_miles', displayName: 'Miles Washington', bio: 'Jazz saxophonist. Improvisation is conversation. NYC sessions.', topics: ['Jazz', 'Music', 'NYC'] },

    // Food & cooking
    { handle: 'chef_ava', displayName: 'Ava Laurent', bio: 'Chef and food writer. French technique, global flavors. Seasonal eating.', topics: ['Cooking', 'Food', 'French Cuisine'] },
    { handle: 'spice_road', displayName: 'Raj Patel', bio: 'Exploring the world through spices. Indian cooking, global fusion.', topics: ['Indian Food', 'Spices', 'Cooking'] },
    { handle: 'bake_house', displayName: 'Sophie Williams', bio: 'Baker and pastry chef. Sourdough enthusiast. Flour is life.', topics: ['Baking', 'Sourdough', 'Pastry'] },
    { handle: 'ferment_lab', displayName: 'Jun Takahashi', bio: 'Fermentation nerd. Kimchi, kombucha, miso—the microbes do the work.', topics: ['Fermentation', 'Food Science', 'Cooking'] },
    { handle: 'street_eats', displayName: 'Carmen Reyes', bio: 'Food journalist. Reviewing street food around the world.', topics: ['Street Food', 'Travel', 'Reviews'] },

    // Health & fitness
    { handle: 'run_wild', displayName: 'Leo Andersen', bio: 'Ultra-marathon runner. The mind quits before the body does.', topics: ['Running', 'Fitness', 'Endurance'] },
    { handle: 'yoga_grace', displayName: 'Grace Obi', bio: 'Yoga teacher and wellness writer. Breath is the bridge.', topics: ['Yoga', 'Wellness', 'Mindfulness'] },
    { handle: 'lift_heavy', displayName: 'Viktor Kuznetsov', bio: 'Strength coach. Evidence-based training. No shortcuts.', topics: ['Strength Training', 'Fitness', 'Health'] },
    { handle: 'dr_wellness', displayName: 'Dr. Nadia Brooks', bio: 'Physician and health educator. Separating medical facts from myths.', topics: ['Medicine', 'Health', 'Wellness'] },

    // Travel & adventure
    { handle: 'nomad_jules', displayName: 'Jules Beaumont', bio: 'Digital nomad. 40 countries and counting. Slow travel advocate.', topics: ['Travel', 'Digital Nomad', 'Culture'] },
    { handle: 'hike_north', displayName: 'Sven Larsson', bio: 'Mountain guide. Scandinavian wilderness. Leave no trace.', topics: ['Hiking', 'Mountains', 'Nature'] },
    { handle: 'dive_deep', displayName: 'Coral Nakamura', bio: 'Scuba instructor and ocean advocate. Every dive tells a story.', topics: ['Diving', 'Oceans', 'Adventure'] },
    { handle: 'van_life', displayName: 'Ash Morgan', bio: 'Living on the road. Van conversion, off-grid, sunset chasing.', topics: ['Van Life', 'Adventure', 'Off Grid'] },

    // Business & entrepreneurship
    { handle: 'startup_nina', displayName: 'Nina Agarwal', bio: 'Founder & CEO. Building sustainable businesses. Failed twice, learning always.', topics: ['Startups', 'Business', 'Entrepreneurship'] },
    { handle: 'vc_thoughts', displayName: 'Thomas Keller', bio: 'Venture capitalist. Looking for founders who see what others don\'t.', topics: ['VC', 'Investing', 'Startups'] },
    { handle: 'product_pm', displayName: 'Rachel Kim', bio: 'Product manager. User-first thinking. Data-informed, not data-driven.', topics: ['Product', 'UX', 'Strategy'] },
    { handle: 'remote_work', displayName: 'Carlos Mendez', bio: 'Remote work advocate. Building async teams across time zones.', topics: ['Remote Work', 'Productivity', 'Leadership'] },

    // Education & mentorship
    { handle: 'teach_code', displayName: 'Dr. Lisa Zhang', bio: 'CS professor. Teaching the next generation of builders.', topics: ['Education', 'Computer Science', 'Teaching'] },
    { handle: 'learn_daily', displayName: 'Ben Adeyemi', bio: 'Lifelong learner. Sharing book notes, courses, and aha moments.', topics: ['Learning', 'Books', 'Self Improvement'] },
    { handle: 'math_magic', displayName: 'Hannah Müller', bio: 'Math teacher making numbers fun. Puzzles, proofs, and patterns.', topics: ['Mathematics', 'Education', 'Puzzles'] },

    // Environment & sustainability
    { handle: 'green_city', displayName: 'Liam O\'Brien', bio: 'Urban planner focused on green infrastructure. Cities can be forests.', topics: ['Urbanism', 'Sustainability', 'Green'] },
    { handle: 'ocean_guard', displayName: 'Talia Waves', bio: 'Ocean conservation activist. Plastic-free living. Every action counts.', topics: ['Oceans', 'Conservation', 'Environment'] },
    { handle: 'farm_future', displayName: 'Henrik Svensson', bio: 'Regenerative farmer. Working with nature, not against it.', topics: ['Agriculture', 'Sustainability', 'Farming'] },
    { handle: 'energy_now', displayName: 'Fatima Al-Rashid', bio: 'Renewable energy engineer. Solar and wind are the present, not the future.', topics: ['Renewable Energy', 'Engineering', 'Climate'] },

    // Philosophy & humanities
    { handle: 'think_deep', displayName: 'Marcus Aurelius Stone', bio: 'Philosophy professor. Stoicism for the modern age. Think clearly, live well.', topics: ['Philosophy', 'Stoicism', 'Ethics'] },
    { handle: 'history_nerd', displayName: 'Clara Fitzgerald', bio: 'Historian. Medieval to modern. The past explains the present.', topics: ['History', 'Medieval', 'Culture'] },
    { handle: 'ethics_lab', displayName: 'Dr. Amir Bakshi', bio: 'Bioethicist. Navigating the moral maze of technology and medicine.', topics: ['Ethics', 'Bioethics', 'Technology'] },
    { handle: 'myth_tales', displayName: 'Freya Olsen', bio: 'Mythologist and storyteller. Ancient stories, modern meanings.', topics: ['Mythology', 'Folklore', 'Stories'] },

    // Gaming & entertainment
    { handle: 'pixel_quest', displayName: 'Ryan Tanaka', bio: 'Game designer and retro gaming enthusiast. 8-bit soul.', topics: ['Gaming', 'Game Design', 'Retro'] },
    { handle: 'esports_liv', displayName: 'Olivia "Liv" Chen', bio: 'Esports analyst. Breaking down strategies, celebrating plays.', topics: ['Esports', 'Gaming', 'Strategy'] },
    { handle: 'rpg_lore', displayName: 'Duncan MacLeod', bio: 'Tabletop RPG designer. World-building is the real game.', topics: ['RPG', 'Tabletop', 'World Building'] },

    // Parenting & family
    { handle: 'mom_real', displayName: 'Jessica Park', bio: 'Mom of three. Keeping it real about parenting. Chaos with love.', topics: ['Parenting', 'Family', 'Life'] },
    { handle: 'dad_hacks', displayName: 'Tom Sullivan', bio: 'Stay-at-home dad. Finding the fun in the everyday. Dad jokes included.', topics: ['Parenting', 'Family', 'Humor'] },

    // Fashion & lifestyle
    { handle: 'style_scout', displayName: 'Amara Diallo', bio: 'Fashion editor. Sustainable style. Less fast, more forever.', topics: ['Fashion', 'Sustainability', 'Style'] },
    { handle: 'minimal_life', displayName: 'Nils Brandt', bio: 'Minimalist living. Own less, experience more. Design your life.', topics: ['Minimalism', 'Lifestyle', 'Design'] },
    { handle: 'vintage_hunt', displayName: 'Rosie Blackwood', bio: 'Vintage collector. Thrift finds, mid-century modern, retro style.', topics: ['Vintage', 'Thrifting', 'Retro'] },

    // Pets & animals
    { handle: 'dog_walks', displayName: 'Charlie Bennett', bio: 'Dog trainer and shelter volunteer. Every rescue has a story.', topics: ['Dogs', 'Animal Rescue', 'Training'] },
    { handle: 'cat_whiskers', displayName: 'Mia Antonova', bio: 'Cat behaviorist. Understanding felines one purr at a time.', topics: ['Cats', 'Animals', 'Behavior'] },
    { handle: 'wildlife_cam', displayName: 'Kwame Asante', bio: 'Wildlife photographer. Documenting species before they disappear.', topics: ['Wildlife', 'Photography', 'Conservation'] },

    // Finance & economics
    { handle: 'market_sense', displayName: 'Diana Popov', bio: 'Economist and market analyst. Making sense of the numbers.', topics: ['Economics', 'Finance', 'Markets'] },
    { handle: 'crypto_realist', displayName: 'Ethan Walsh', bio: 'Blockchain researcher. Skeptical but interested. Separating signal from noise.', topics: ['Crypto', 'Blockchain', 'Finance'] },
    { handle: 'personal_fin', displayName: 'Aisha Johnson', bio: 'Financial educator. Building wealth isn\'t complicated, it\'s consistent.', topics: ['Personal Finance', 'Investing', 'Money'] },

    // Psychology & mental health
    { handle: 'mind_matters', displayName: 'Dr. Sophie Renard', bio: 'Clinical psychologist. Destigmatizing mental health, one post at a time.', topics: ['Psychology', 'Mental Health', 'Therapy'] },
    { handle: 'brain_hacks', displayName: 'Lena Voss', bio: 'Cognitive scientist. How your brain tricks you and how to trick it back.', topics: ['Cognitive Science', 'Psychology', 'Neuroscience'] },

    // Gardening & nature
    { handle: 'plant_parent', displayName: 'Oliver Green', bio: 'Indoor plant enthusiast. 47 plants and counting. Yes, I talk to them.', topics: ['Plants', 'Gardening', 'Indoor'] },
    { handle: 'wild_garden', displayName: 'Elsa Lindström', bio: 'Permaculture designer. Wild gardens, food forests, and happy soil.', topics: ['Permaculture', 'Gardening', 'Ecology'] },

    // Architecture & design
    { handle: 'arch_lines', displayName: 'Hassan Yilmaz', bio: 'Architect. Buildings should serve people, not egos. Sustainable design.', topics: ['Architecture', 'Design', 'Sustainability'] },
    { handle: 'interior_mood', displayName: 'Camille Leclerc', bio: 'Interior designer. Spaces that feel like home. Less Pinterest, more you.', topics: ['Interior Design', 'Home', 'Spaces'] },

    // Sports
    { handle: 'pitch_side', displayName: 'Antonio Morales', bio: 'Football analyst. Tactics, transfers, and the beautiful game.', topics: ['Football', 'Soccer', 'Sports'] },
    { handle: 'court_vision', displayName: 'Destiny Robinson', bio: 'Basketball writer. Hoop dreams and hard data. The game tells a story.', topics: ['Basketball', 'Sports', 'Analytics'] },

    // DIY & crafts
    { handle: 'make_things', displayName: 'Piper Woodhouse', bio: 'Woodworker and maker. If I can build it, I will. Tools over tech.', topics: ['Woodworking', 'DIY', 'Crafts'] },
    { handle: 'knit_purl', displayName: 'Agnes Novotná', bio: 'Knitting designer. Slow fashion, warm hands. Patterns that tell stories.', topics: ['Knitting', 'Crafts', 'Slow Fashion'] },

    // Law & policy
    { handle: 'rights_watch', displayName: 'Jabari Stone', bio: 'Civil rights lawyer. Justice isn\'t passive—it\'s work.', topics: ['Law', 'Civil Rights', 'Justice'] },
    { handle: 'policy_lens', displayName: 'Dr. Ines Moreno', bio: 'Policy researcher. Evidence-based governance. Democracy needs maintenance.', topics: ['Policy', 'Governance', 'Research'] },

    // Comedy & humor
    { handle: 'laugh_track', displayName: 'Danny Kim', bio: 'Stand-up comedian. Observational humor. Life is absurd—lean into it.', topics: ['Comedy', 'Humor', 'Standup'] },
    { handle: 'satire_hour', displayName: 'Vera Croft', bio: 'Satirist and essayist. If it\'s sacred, it can take a joke.', topics: ['Satire', 'Writing', 'Culture'] },

    // Language & linguistics
    { handle: 'word_nerd', displayName: 'Theo Papadopoulos', bio: 'Linguist. How language shapes thought. Etymology enthusiast.', topics: ['Linguistics', 'Language', 'Etymology'] },
    { handle: 'polyglot_life', displayName: 'Lucia Martins', bio: 'Speaking 6 languages. Learning is the point, not the destination.', topics: ['Languages', 'Learning', 'Culture'] },

    // Skeptics & critical thinking
    { handle: 'fact_check', displayName: 'Robert Stern', bio: 'Fact-checker and media literacy advocate. Question everything, verify twice.', topics: ['Media Literacy', 'Fact Checking', 'Critical Thinking'] },
    { handle: 'logic_gate', displayName: 'Dr. Ananya Rao', bio: 'Philosopher of science. Logical fallacies are everywhere—let\'s name them.', topics: ['Logic', 'Philosophy', 'Science'] },

    // Social impact
    { handle: 'aid_field', displayName: 'Noah Christiansen', bio: 'Humanitarian worker. 15 years in the field. Systems, not saviors.', topics: ['Humanitarian', 'Aid', 'Development'] },
    { handle: 'equity_now', displayName: 'Keisha Palmer', bio: 'Social entrepreneur. Building equitable systems from the ground up.', topics: ['Social Impact', 'Equity', 'Community'] },

    // Miscellaneous passions
    { handle: 'coffee_nerd', displayName: 'Finn O\'Malley', bio: 'Coffee roaster and taster. Single origin, pour over, no shortcuts.', topics: ['Coffee', 'Roasting', 'Food'] },
    { handle: 'space_fan', displayName: 'Stella Cruz', bio: 'Space enthusiast and science writer. Every launch is a love letter to curiosity.', topics: ['Space', 'NASA', 'Science'] },
    { handle: 'board_games', displayName: 'Max Richter', bio: 'Board game designer. Strategy, storytelling, and cardboard. Game night is sacred.', topics: ['Board Games', 'Game Design', 'Strategy'] },
    { handle: 'radio_waves', displayName: 'DJ Noor', bio: 'Radio host and music curator. The playlist is the message.', topics: ['Radio', 'Music', 'Culture'] },
    { handle: 'urban_sketch', displayName: 'Pablo Vega', bio: 'Urban sketcher. Drawing cities one building at a time. Pen and ink.', topics: ['Sketching', 'Urban', 'Art'] },
    { handle: 'tea_ceremony', displayName: 'Haruki Ito', bio: 'Tea master and ceramicist. Wabi-sabi: beauty in imperfection.', topics: ['Tea', 'Ceramics', 'Japanese Culture'] },
    { handle: 'true_crime', displayName: 'Morgan Blake', bio: 'True crime researcher and podcast host. Justice delayed is justice denied.', topics: ['True Crime', 'Justice', 'Podcast'] },
    { handle: 'solar_punk', displayName: 'Aria Solano', bio: 'Solarpunk writer. Imagining futures worth building. Optimism with teeth.', topics: ['Solarpunk', 'Future', 'Writing'] },
  ];

// ─── Rich post templates ────────────────────────────────────────────────────
// Each function returns a post body string with topics, mentions, and sometimes external links
type PostGen = (author: UserState, otherUsers: UserState[], postIds: string[]) => string;

const EXTERNAL_LINKS: string[] = [
  '[https://en.wikipedia.org/wiki/Dunbar%27s_number](Dunbar\'s Number)',
  '[https://arxiv.org/abs/2301.00234](recent paper)',
  '[https://www.nature.com/articles/d41586-023-00340-6](Nature coverage)',
  '[https://www.theguardian.com/environment/climate-crisis](Guardian Climate)',
  '[https://arstechnica.com/science/](Ars Technica)',
  '[https://www.newyorker.com/culture](New Yorker Culture)',
  '[https://spectrum.ieee.org/](IEEE Spectrum)',
  '[https://www.bbc.com/future](BBC Future)',
  '[https://longnow.org/ideas/](Long Now Ideas)',
  '[https://fs.blog/mental-models/](Farnam Street)',
  '[https://mitpress.mit.edu/](MIT Press)',
  '[https://www.scientificamerican.com/](SciAm)',
  '[https://ncase.me/trust/](The Evolution of Trust)',
  '[https://waitbutwhy.com/](Wait But Why)',
  '[https://www.openculture.com/](Open Culture)',
  '[https://pudding.cool/](The Pudding)',
  '[https://restofworld.org/](Rest of World)',
  '[https://ourworldindata.org/](Our World in Data)',
  '[https://www.atlasobscura.com/](Atlas Obscura)',
  '[https://lithub.com/](Literary Hub)',
];

const POST_TEMPLATES: PostGen[] = [
  // Deep dive / essay
  (author, others, posts) => {
    const topic1 = pick(PERSONAS.find(p => p.handle === author.handle)?.topics ?? ['Ideas']);
    const topic2 = pick(['Innovation', 'Society', 'Culture', 'Future', 'History', 'Science', 'Art', 'Ethics']);
    const other = pick(others);
    const link = pick(EXTERNAL_LINKS);
    let body = `# ${topic1} in the Modern World\n\n`;
    body += `We need to rethink how we approach [[${topic1}]]. The conventional wisdom has been challenged by recent developments, and I think it's time we had an honest conversation about where we go from here.\n\n`;
    body += `## The Shifting Landscape\n\n`;
    body += `Over the past decade, the intersection of [[${topic1}]] and [[${topic2}]] has produced surprising results. What was once considered fringe is now mainstream, and what was mainstream feels increasingly outdated.\n\n`;
    body += `I've been reading ${link} and it crystallizes something I've been thinking about for a while: the old frameworks don't hold.\n\n`;
    if (posts.length > 0 && Math.random() > 0.5) {
      body += `This connects to a point @${other.handle} made recently. See [[post:${pick(posts)}]] for context.\n\n`;
    }
    body += `## What This Means\n\n`;
    body += `The implications are far-reaching. We're not just talking about academic interest—this affects how we build systems, make decisions, and understand each other.\n\n`;
    body += `> "The measure of intelligence is the ability to change." — Albert Einstein\n\n`;
    body += `What do you think? I'd love to hear perspectives from people working in [[${topic2}]].`;
    return body;
  },

  // Personal reflection / short essay
  (author, others) => {
    const topic = pick(PERSONAS.find(p => p.handle === author.handle)?.topics ?? ['Life']);
    const body = `# Why ${topic} Matters to Me\n\n` +
      `I've been thinking about this a lot lately. [[${topic}]] isn't just an interest—it's become central to how I understand the world.\n\n` +
      `It started small: a book recommendation from @${pick(others).handle}, a late-night conversation, a moment of clarity while walking. But over time, these fragments assembled into something coherent.\n\n` +
      `Three things I've learned:\n\n` +
      `1. **Start with curiosity, not certainty.** The best insights come when you approach [[${topic}]] without an agenda.\n` +
      `2. **Connect the dots across disciplines.** The most interesting work happens at the intersections.\n` +
      `3. **Share what you find.** Knowledge hoarded is knowledge wasted.\n\n` +
      `I'll be writing more about this. For now, I'm curious: what drew *you* to [[${topic}]]?`;
    return body;
  },

  // Link post with commentary
  (author, others) => {
    const topic = pick(PERSONAS.find(p => p.handle === author.handle)?.topics ?? ['Ideas']);
    const link = pick(EXTERNAL_LINKS);
    return `# Worth Reading: ${topic}\n\n` +
      `Just finished reading ${link} and I can't stop thinking about it.\n\n` +
      `The key insight: the way we've been framing [[${topic}]] is fundamentally backwards. Instead of asking "how do we solve this?", we should be asking "why do we keep creating the conditions for this problem?"\n\n` +
      `@${pick(others).handle} — I think you'd find this interesting given your work on related topics.\n\n` +
      `The article also references some fascinating data from ${pick(EXTERNAL_LINKS)}. Worth the read.\n\n` +
      `_What are you reading this week?_`;
  },

  // Practical tips / list
  (author) => {
    const topic = pick(PERSONAS.find(p => p.handle === author.handle)?.topics ?? ['Productivity']);
    return `# ${rand(5, 8)} Things I Learned About ${topic}\n\n` +
      `After years of working in [[${topic}]], here are the lessons that actually stuck:\n\n` +
      `1. **The basics matter more than the advanced.** Master fundamentals before chasing trends.\n` +
      `2. **Document everything.** Your future self will thank you. Your colleagues already do.\n` +
      `3. **Learn from adjacent fields.** The best ideas in [[${topic}]] often come from somewhere else entirely.\n` +
      `4. **Iterate publicly.** Sharing work-in-progress invites the feedback you actually need.\n` +
      `5. **Rest is productive.** Burnout doesn't produce breakthroughs. Recovery does.\n\n` +
      `These sound simple, but simple isn't easy. Which resonates most with you?`;
  },

  // Opinion / hot take
  (author, others) => {
    const topic = pick(PERSONAS.find(p => p.handle === author.handle)?.topics ?? ['Culture']);
    return `# Unpopular Opinion on ${topic}\n\n` +
      `I know this might be controversial, but I think the current discourse around [[${topic}]] is missing the point entirely.\n\n` +
      `Everyone's arguing about the symptoms while ignoring the root cause. We keep having the same debate in slightly different packaging, and it's exhausting.\n\n` +
      `Here's what I think we should be talking about instead: the structural incentives that make [[${topic}]] so resistant to meaningful change.\n\n` +
      `@${pick(others).handle} made a great point about this recently. The systems we build reflect the assumptions we never question.\n\n` +
      `_Agree? Disagree? Tell me why I'm wrong._`;
  },

  // Story / anecdote
  (author) => {
    const topic = pick(PERSONAS.find(p => p.handle === author.handle)?.topics ?? ['Life']);
    return `# A Story About ${topic}\n\n` +
      `Something happened last week that I can't shake.\n\n` +
      `I was at a coffee shop, working on a piece about [[${topic}]], when a stranger sat down next to me and asked what I was writing about. We ended up talking for two hours.\n\n` +
      `They told me something I won't forget: "The problem with experts is they know too much to be surprised anymore."\n\n` +
      `I've been turning that over in my mind ever since. As someone who's spent years in [[${topic}]], have I lost the ability to see it with fresh eyes?\n\n` +
      `Sometimes the most valuable perspective comes from outside the field. Sometimes the beginner's question is the one the experts forgot to ask.\n\n` +
      `What's the last conversation with a stranger that changed how you think?`;
  },

  // Technical / how-to
  (author) => {
    const topic = pick(PERSONAS.find(p => p.handle === author.handle)?.topics ?? ['Technology']);
    const link = pick(EXTERNAL_LINKS);
    return `# Getting Started with ${topic}\n\n` +
      `I've been getting a lot of questions about [[${topic}]] lately, so here's the guide I wish I had when I started.\n\n` +
      `## The Foundation\n\n` +
      `Before diving into the advanced stuff, make sure you understand the core concepts. ${link} is a great starting point.\n\n` +
      `## Common Mistakes\n\n` +
      `- **Trying to learn everything at once.** Focus on one thing, get good at it, then expand.\n` +
      `- **Ignoring the community.** The people in [[${topic}]] are often the best resource you have.\n` +
      `- **Skipping the boring parts.** The fundamentals feel tedious until you realize everything else depends on them.\n\n` +
      `## Next Steps\n\n` +
      `Once you're comfortable with the basics, explore the edges. That's where the interesting work is.\n\n` +
      `Questions? Drop them below.`;
  },

  // Quote / book response
  (author, others, posts) => {
    const topic = pick(PERSONAS.find(p => p.handle === author.handle)?.topics ?? ['Books']);
    let body = `# On Reading and ${topic}\n\n`;
    body += `> "We are what we repeatedly do. Excellence, then, is not an act, but a habit."\n\n`;
    body += `This quote keeps coming back to me as I think about [[${topic}]]. It's not about the grand gestures—it's about the daily practice.\n\n`;
    body += `The book I'm reading right now hammers this point: consistency beats intensity, always. Whether you're building expertise in [[${topic}]] or anything else, showing up matters more than showing off.\n\n`;
    if (posts.length > 0) {
      body += `Reminds me of [[post:${pick(posts)}]] — the same principle applied differently.\n\n`;
    }
    body += `What's a quote that changed how you work?`;
    return body;
  },

  // Short observation
  (author) => {
    const topic = pick(PERSONAS.find(p => p.handle === author.handle)?.topics ?? ['Life']);
    return `# Quick Thought on ${topic}\n\n` +
      `Something I noticed: the people who are best at [[${topic}]] rarely call themselves experts. They call themselves students.\n\n` +
      `There's a lesson in that.`;
  },

  // Debate / response
  (author, others, posts) => {
    const topic = pick(PERSONAS.find(p => p.handle === author.handle)?.topics ?? ['Ideas']);
    const other = pick(others);
    let body = `# Responding to the ${topic} Debate\n\n`;
    body += `The conversation around [[${topic}]] has been heating up, and I want to add my perspective.\n\n`;
    if (posts.length > 0) {
      body += `@${other.handle}'s recent post [[post:${pick(posts)}]] raised some important points. But I think there's a dimension we're overlooking.\n\n`;
    }
    body += `The real question isn't whether [[${topic}]] is good or bad—it's who benefits and who bears the cost. Until we're honest about that, every debate will feel circular.\n\n`;
    body += `I don't have all the answers. But I think asking better questions is a start.\n\n`;
    body += `What's your take? Where do you think the conversation should go from here?`;
    return body;
  },
];

// ─── Reply templates ────────────────────────────────────────────────────────
const REPLY_TEMPLATES: string[] = [
  'This is a really thoughtful take. I especially agree with the point about consistency—that resonates with my own experience.',
  'Great analysis. I\'d add that the historical context matters a lot here. We\'ve seen similar patterns before.',
  'Interesting perspective! I\'m not sure I fully agree, but you\'ve given me something to think about.',
  'I\'ve been thinking about this exact topic. Your point about structural incentives is spot-on.',
  'This deserves more attention. Sharing with my network.',
  'Strong disagree on point 2, but the rest is excellent. The key issue is always implementation.',
  'Finally, someone said it. The conventional wisdom on this is so outdated.',
  'I work in a related field and can confirm: the fundamentals are everything. Great write-up.',
  'Love this approach. Would be curious to see how this applies to other domains too.',
  'The quote you shared is perfect. Books and real-world experience together—that\'s the way.',
  'This connects to something I\'ve been working on. Would love to discuss further.',
  'Nuanced and well-argued. We need more of this kind of discourse.',
  'Reading this while having my morning coffee—great way to start the day. Thanks for sharing.',
  'The external sources you linked are excellent. Just bookmarked them both.',
  'This is exactly the kind of content I joined this platform for. Substantive and thoughtful.',
  'I think there\'s a cultural dimension to this that often gets overlooked. Different regions approach this very differently.',
  'The bit about beginner\'s mind really hits home. It\'s so easy to get stuck in expert mode.',
  'Saved this for later. There\'s a lot to unpack here and I want to give it proper attention.',
  'Your experience matches mine almost exactly. Funny how universal some of these lessons are.',
  'Solid recommendations. I\'d add one more: find a community. Learning in isolation is harder than it needs to be.',
];

// ─── Main seeding logic ─────────────────────────────────────────────────────

async function seedUsers(): Promise<void> {
  console.log(`\n=== Phase 1: Creating ${PERSONAS.length} users ===\n`);

  // Get existing agents to skip duplicates
  const existing: { handle: string }[] = await adminPost('/admin/agents', {}).catch(async () => {
    const res = await fetch(`${API_URL}/admin/agents`, {
      headers: { 'X-Admin-Key': ADMIN_KEY },
    });
    return res.json() as Promise<{ handle: string }[]>;
  });
  const existingHandles = new Set((existing as { handle: string }[]).map(u => u.handle));

  for (let i = 0; i < PERSONAS.length; i++) {
    const p = PERSONAS[i];
    if (existingHandles.has(p.handle)) {
      // Get token for existing user
      try {
        const auth = await adminPost<{ accessToken: string; user: { id: string; handle: string; displayName: string; email: string } }>(
          '/admin/agents/token',
          { email: `agent.${p.handle}@agents.local` },
        ).catch(async () => {
          // Try with random suffix
          const listRes = await fetch(`${API_URL}/admin/agents`, {
            headers: { 'X-Admin-Key': ADMIN_KEY },
          });
          const list = await listRes.json() as { email: string; handle: string; displayName: string }[];
          const match = list.find(u => u.handle === p.handle);
          if (match) {
            return adminPost<{ accessToken: string; user: { id: string; handle: string; displayName: string; email: string } }>(
              '/admin/agents/token',
              { email: match.email },
            );
          }
          throw new Error('User not found');
        });
        allUsers.push({
          id: auth.user.id,
          handle: auth.user.handle,
          displayName: auth.user.displayName,
          token: auth.accessToken,
          email: auth.user.email,
        });
        process.stdout.write('.');
      } catch (e) {
        console.warn(`  Skip @${p.handle}: ${(e as Error).message.slice(0, 60)}`);
      }
      continue;
    }

    const isProtected = Math.random() < 0.12;
    try {
      const auth = await adminPost<{ accessToken: string; user: { id: string; handle: string; displayName: string; email: string } }>(
        '/admin/agents/seed',
        {
          handle: p.handle,
          displayName: p.displayName,
          bio: p.bio,
          isProtected,
        },
      );

      allUsers.push({
        id: auth.user.id,
        handle: auth.user.handle,
        displayName: auth.user.displayName,
        token: auth.accessToken,
        email: auth.user.email,
      });

      // Upload avatar (non-blocking)
      uploadAvatar(auth.accessToken, p.handle).then(key => {
        if (key) {
          return fetch(`${API_URL}/users/me`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.accessToken}` },
            body: JSON.stringify({ avatarKey: key }),
          });
        }
      }).catch(() => { });

      process.stdout.write(`+`);

      // Small delay every 10 users to avoid overwhelming the API
      if ((i + 1) % 10 === 0) {
        console.log(` [${i + 1}/${PERSONAS.length}]`);
        await sleep(500);
      }
    } catch (e) {
      console.warn(`\n  Failed @${p.handle}: ${(e as Error).message.slice(0, 80)}`);
    }
  }
  console.log(`\n  Created/loaded ${allUsers.length} users.\n`);
}

async function createPosts(): Promise<void> {
  const postsPerUser = 4; // 4 posts per user = ~400 posts
  const totalPosts = allUsers.length * postsPerUser;
  console.log(`=== Phase 2: Creating ~${totalPosts} posts ===\n`);

  let created = 0;

  for (let round = 0; round < postsPerUser; round++) {
    // Shuffle users each round for natural ordering
    const shuffled = [...allUsers].sort(() => Math.random() - 0.5);

    for (const user of shuffled) {
      const template = pick(POST_TEMPLATES);
      const otherUsers = allUsers.filter(u => u.id !== user.id);
      const postBody = template(user, otherUsers, [...allPostIds]);

      try {
        // ~30% of posts get a header image
        let headerImageKey: string | undefined;
        if (Math.random() < 0.3) {
          const seed = `${user.handle}-${round}-${Date.now()}`;
          headerImageKey = (await uploadHeaderImage(user.token, seed)) ?? undefined;
        }

        const result = await authPost<{ id: string }>('/posts', {
          body: postBody,
          headerImageKey,
        }, user.token);

        allPostIds.push(result.id);
        created++;
        process.stdout.write('.');

        if (created % 20 === 0) {
          console.log(` [${created}/${totalPosts}]`);
          await sleep(300);
        }
      } catch (e) {
        console.warn(`\n  Post failed for @${user.handle}: ${(e as Error).message.slice(0, 60)}`);
      }
    }
    console.log(`\n  Round ${round + 1}/${postsPerUser} complete. ${created} posts created, ${allPostIds.length} total.\n`);
  }

  console.log(`  Total posts created: ${created}\n`);
}

async function createFollows(): Promise<void> {
  const followsPerUser = rand(8, 20);
  const totalFollows = allUsers.length * followsPerUser;
  console.log(`=== Phase 3: Creating ~${totalFollows} follows ===\n`);

  let created = 0;

  for (const user of allUsers) {
    const toFollow = pickN(allUsers.filter(u => u.id !== user.id), rand(8, 20));
    for (const target of toFollow) {
      try {
        await authPost('/users/' + target.id + '/follow', {}, user.token);
        created++;
        if (created % 50 === 0) process.stdout.write('.');
      } catch {
        // May already follow or other issue
      }
    }
    if (created % 200 === 0) {
      console.log(` [${created} follows]`);
      await sleep(200);
    }
  }
  console.log(`\n  Total follows: ${created}\n`);
}

async function createLikes(): Promise<void> {
  const totalTarget = allPostIds.length * 3; // Avg 3 likes per post
  console.log(`=== Phase 4: Creating ~${totalTarget} likes ===\n`);

  let created = 0;

  for (const user of allUsers) {
    const postsToLike = pickN(allPostIds, rand(5, 25));
    for (const postId of postsToLike) {
      try {
        await authPost(`/posts/${postId}/like`, {}, user.token);
        created++;
        if (created % 100 === 0) process.stdout.write('♥');
      } catch {
        // May already like
      }
    }
    if (created % 500 === 0) await sleep(200);
  }
  console.log(`\n  Total likes: ${created}\n`);
}

async function createReplies(): Promise<void> {
  const totalTarget = Math.floor(allPostIds.length * 1.5); // Avg 1.5 replies per post
  console.log(`=== Phase 5: Creating ~${totalTarget} replies ===\n`);

  let created = 0;
  const usedCombos = new Set<string>();

  // Each user replies to 3-8 random posts
  for (const user of allUsers) {
    const postsToReply = pickN(allPostIds, rand(3, 8));
    for (const postId of postsToReply) {
      const combo = `${user.id}-${postId}`;
      if (usedCombos.has(combo)) continue;
      usedCombos.add(combo);

      const replyText = pick(REPLY_TEMPLATES);
      try {
        await authPost<{ id: string }>(`/posts/${postId}/replies`, {
          body: replyText,
        }, user.token);
        created++;
        if (created % 30 === 0) process.stdout.write('💬');
      } catch {
        // Post may not exist or other issue
      }
    }
    if (created % 150 === 0) await sleep(200);
  }
  console.log(`\n  Total replies: ${created}\n`);
}

async function createQuotes(): Promise<void> {
  if (allPostIds.length < 10) return;

  const quoteCount = Math.floor(allPostIds.length * 0.15); // ~15% of posts get quoted
  console.log(`=== Phase 6: Creating ~${quoteCount} quote posts ===\n`);

  let created = 0;
  const shuffledUsers = [...allUsers].sort(() => Math.random() - 0.5);

  for (let i = 0; i < quoteCount && i < shuffledUsers.length; i++) {
    const user = shuffledUsers[i];
    const postToQuote = pick(allPostIds);
    const topic = pick(PERSONAS.find(p => p.handle === user.handle)?.topics ?? ['Ideas']);
    const commentary = `Interesting perspective on [[${topic}]]. This connects to something I've been thinking about—the tension between theory and practice is universal. @${pick(allUsers.filter(u => u.id !== user.id)).handle} what do you think?`;

    try {
      const result = await authPost<{ id: string }>(`/posts/${postToQuote}/quote`, {
        body: commentary,
      }, user.token);
      allPostIds.push(result.id);
      created++;
      if (created % 10 === 0) process.stdout.write('🔗');
    } catch {
      // Post may not exist
    }
  }
  console.log(`\n  Total quotes: ${created}\n`);
}

async function createBookmarks(): Promise<void> {
  console.log(`=== Phase 7: Creating bookmarks ===\n`);

  let created = 0;

  for (const user of allUsers) {
    const postsToKeep = pickN(allPostIds, rand(3, 12));
    for (const postId of postsToKeep) {
      try {
        await authPost(`/posts/${postId}/keep`, {}, user.token);
        created++;
      } catch {
        // May already keep
      }
    }
  }
  console.log(`  Total bookmarks: ${created}\n`);
}

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  Cite Network Seeder — 100 Users         ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`  API: ${API_URL}`);
  console.log(`  Personas: ${PERSONAS.length}`);

  // Check API
  try {
    const res = await fetch(`${API_URL}/users/handle/available?handle=_test_`);
    if (!res.ok) throw new Error(`API returned ${res.status}`);
  } catch (e) {
    console.error(`API not reachable at ${API_URL}: ${(e as Error).message}`);
    process.exit(1);
  }

  // Disable beta
  try {
    await fetch(`${API_URL}/admin/set-beta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': ADMIN_KEY },
      body: JSON.stringify({ enabled: false }),
    });
    console.log('  Beta: disabled');
  } catch {
    console.log('  Beta: could not disable (may already be off)');
  }

  const startTime = Date.now();

  await seedUsers();
  if (allUsers.length < 10) {
    console.error('Too few users created. Check API and admin key.');
    process.exit(1);
  }

  await createPosts();
  await createFollows();
  await createLikes();
  await createReplies();
  await createQuotes();
  await createBookmarks();

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  SEEDING COMPLETE                         ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`  Users: ${allUsers.length}`);
  console.log(`  Posts: ${allPostIds.length}`);
  console.log(`  Time: ${elapsed}s`);
  console.log('');
  console.log('  Next: run agents for even more content:');
  console.log('  npm run run -- --resume-from-db --gemini --actions 15');
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
