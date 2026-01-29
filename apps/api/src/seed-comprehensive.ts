/**
 * Comprehensive seed: realistic social network data for end-to-end testing.
 *
 * IDs: User uses @PrimaryColumn('uuid') so we set id explicitly. All other
 * entities use @PrimaryGeneratedColumn('uuid') and get UUIDs from the database.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Post, PostVisibility } from './entities/post.entity';
import { Topic } from './entities/topic.entity';
import { PostTopic } from './entities/post-topic.entity';
import { Follow } from './entities/follow.entity';
import { Reply } from './entities/reply.entity';
import { Like } from './entities/like.entity';
import { Keep } from './entities/keep.entity';
import { PostEdge, EdgeType } from './entities/post-edge.entity';
import { Collection } from './entities/collection.entity';
import { CollectionItem } from './entities/collection-item.entity';
import { Mention } from './entities/mention.entity';
import { TopicFollow } from './entities/topic-follow.entity';
import { Invite } from './entities/invite.entity';
import { SystemSetting } from './entities/system-setting.entity';
import { WaitingList } from './entities/waiting-list.entity';
import { NotificationPref } from './entities/notification-pref.entity';
import { Block } from './entities/block.entity';
import { Mute } from './entities/mute.entity';
import {
  Report,
  ReportTargetType,
  ReportStatus,
} from './entities/report.entity';
import { DmThread } from './entities/dm-thread.entity';
import { DmMessage } from './entities/dm-message.entity';
import {
  FollowRequest,
  FollowRequestStatus,
} from './entities/follow-request.entity';
import { PushToken, PushProvider } from './entities/push-token.entity';
import { Neo4jService } from './database/neo4j.service';
import { v4 as uuidv4 } from 'uuid';

// --- PERSONAS: mix of public/private, custom recommendation prefs, languages ---
const PERSONAS = [
  {
    id: uuidv4(),
    handle: 'alex.urban',
    name: 'Alex Rivera',
    bio: 'Cities for people, not cars. Urbanist & advocate. 🚲🌆',
    lang: 'en',
    isProtected: false,
    explore: {
      topicsYouFollow: 90,
      languageMatch: 80,
      citations: 95,
      replies: 60,
      likes: 40,
      networkProximity: 50,
    },
  },
  {
    id: uuidv4(),
    handle: 'sarah.tech',
    name: 'Sarah Chen',
    bio: 'Systems engineer. Rustacean. Building safe infra. 🦀',
    lang: 'en',
    isProtected: false,
    explore: {
      topicsYouFollow: 85,
      languageMatch: 70,
      citations: 90,
      replies: 70,
      likes: 35,
      networkProximity: 60,
    },
  },
  {
    id: uuidv4(),
    handle: 'mike.skeptic',
    name: 'Mike Johnson',
    bio: 'Asking the hard questions. Freedom maximalist.',
    lang: 'en',
    isProtected: true,
    explore: {
      topicsYouFollow: 50,
      languageMatch: 60,
      citations: 70,
      replies: 80,
      likes: 20,
      networkProximity: 70,
    },
  },
  {
    id: uuidv4(),
    handle: 'emily.green',
    name: 'Emily Park',
    bio: 'Climate scientist. Data-driven. IPCC contributor.',
    lang: 'en',
    isProtected: false,
    explore: {
      topicsYouFollow: 95,
      languageMatch: 75,
      citations: 98,
      replies: 50,
      likes: 45,
      networkProximity: 40,
    },
  },
  {
    id: uuidv4(),
    handle: 'david.des',
    name: 'David Kim',
    bio: 'UI/UX and accessible design. A11y first.',
    lang: 'en',
    isProtected: false,
    explore: {
      topicsYouFollow: 75,
      languageMatch: 80,
      citations: 85,
      replies: 55,
      likes: 50,
      networkProximity: 55,
    },
  },
  {
    id: uuidv4(),
    handle: 'lisa.journo',
    name: 'Lisa Vance',
    bio: 'Tech journalist. Future of work & platforms.',
    lang: 'en',
    isProtected: false,
    explore: {
      topicsYouFollow: 70,
      languageMatch: 65,
      citations: 88,
      replies: 75,
      likes: 30,
      networkProximity: 65,
    },
  },
  {
    id: uuidv4(),
    handle: 'marcus.phil',
    name: 'Marcus Webb',
    bio: 'Stoicism and modern life. Memento mori.',
    lang: 'en',
    isProtected: true,
    explore: {
      topicsYouFollow: 60,
      languageMatch: 90,
      citations: 75,
      replies: 40,
      likes: 25,
      networkProximity: 45,
    },
  },
  {
    id: uuidv4(),
    handle: 'maria.es',
    name: 'María González',
    bio: 'Arquitectura y diseño urbano. Barcelona.',
    lang: 'es',
    isProtected: false,
    explore: {
      topicsYouFollow: 80,
      languageMatch: 95,
      citations: 85,
      replies: 60,
      likes: 40,
      networkProximity: 50,
    },
  },
  {
    id: uuidv4(),
    handle: 'james.dev',
    name: 'James Wright',
    bio: 'Full-stack. TypeScript & Go. Open source.',
    lang: 'en',
    isProtected: false,
    explore: {
      topicsYouFollow: 88,
      languageMatch: 72,
      citations: 92,
      replies: 65,
      likes: 38,
      networkProximity: 58,
    },
  },
  {
    id: uuidv4(),
    handle: 'anna.art',
    name: 'Anna Kozlov',
    bio: 'Digital artist. Generative art & code.',
    lang: 'en',
    isProtected: false,
    explore: {
      topicsYouFollow: 65,
      languageMatch: 78,
      citations: 70,
      replies: 85,
      likes: 55,
      networkProximity: 62,
    },
  },
  {
    id: uuidv4(),
    handle: 'yuki.jp',
    name: 'Yuki Tanaka',
    bio: 'Privacy researcher. Encryption & identity.',
    lang: 'ja',
    isProtected: false,
    explore: {
      topicsYouFollow: 92,
      languageMatch: 88,
      citations: 96,
      replies: 45,
      likes: 28,
      networkProximity: 42,
    },
  },
  {
    id: uuidv4(),
    handle: 'oliver.news',
    name: 'Oliver News',
    bio: 'Curator. Just the links. No hot takes.',
    lang: 'en',
    isProtected: false,
    explore: {
      topicsYouFollow: 55,
      languageMatch: 60,
      citations: 99,
      replies: 30,
      likes: 15,
      networkProximity: 35,
    },
  },
  {
    id: uuidv4(),
    handle: 'rebecca.policy',
    name: 'Rebecca Shaw',
    bio: 'Policy analyst. Tech regulation & rights.',
    lang: 'en',
    isProtected: true,
    explore: {
      topicsYouFollow: 78,
      languageMatch: 82,
      citations: 88,
      replies: 72,
      likes: 32,
      networkProximity: 68,
    },
  },
  {
    id: uuidv4(),
    handle: 'tom.rust',
    name: 'Tom Blake',
    bio: 'Rust core contributor. Memory safety advocate.',
    lang: 'en',
    isProtected: false,
    explore: {
      topicsYouFollow: 94,
      languageMatch: 76,
      citations: 97,
      replies: 58,
      likes: 42,
      networkProximity: 48,
    },
  },
  {
    id: uuidv4(),
    handle: 'nina.design',
    name: 'Nina Petrova',
    bio: 'Design systems. Component libraries.',
    lang: 'en',
    isProtected: false,
    explore: {
      topicsYouFollow: 72,
      languageMatch: 85,
      citations: 80,
      replies: 68,
      likes: 48,
      networkProximity: 52,
    },
  },
  {
    id: uuidv4(),
    handle: 'chris.indie',
    name: 'Chris Moore',
    bio: 'Indie hacker. Bootstrapping in public.',
    lang: 'en',
    isProtected: false,
    explore: {
      topicsYouFollow: 68,
      languageMatch: 70,
      citations: 82,
      replies: 78,
      likes: 35,
      networkProximity: 72,
    },
  },
  {
    id: uuidv4(),
    handle: 'fatima.data',
    name: 'Fatima Al-Hassan',
    bio: 'Data science. ML fairness & ethics.',
    lang: 'en',
    isProtected: false,
    explore: {
      topicsYouFollow: 86,
      languageMatch: 74,
      citations: 91,
      replies: 52,
      likes: 44,
      networkProximity: 46,
    },
  },
  {
    id: uuidv4(),
    handle: 'leo.writer',
    name: 'Leo Martelli',
    bio: 'Essayist. Long-form on tech and society.',
    lang: 'en',
    isProtected: true,
    explore: {
      topicsYouFollow: 82,
      languageMatch: 90,
      citations: 93,
      replies: 48,
      likes: 36,
      networkProximity: 44,
    },
  },
  {
    id: uuidv4(),
    handle: 'zara.ux',
    name: 'Zara Khan',
    bio: 'UX research. Human-centered AI.',
    lang: 'en',
    isProtected: false,
    explore: {
      topicsYouFollow: 74,
      languageMatch: 79,
      citations: 84,
      replies: 62,
      likes: 46,
      networkProximity: 54,
    },
  },
  {
    id: uuidv4(),
    handle: 'henry.teacher',
    name: 'Henry Liu',
    bio: 'CS educator. Making hard concepts simple.',
    lang: 'en',
    isProtected: false,
    explore: {
      topicsYouFollow: 88,
      languageMatch: 82,
      citations: 89,
      replies: 82,
      likes: 50,
      networkProximity: 58,
    },
  },
];

const TOPICS = [
  { slug: 'urbanism', title: 'Urbanism' },
  { slug: 'technology', title: 'Technology' },
  { slug: 'rust', title: 'Rust' },
  { slug: 'climate', title: 'Climate' },
  { slug: 'design', title: 'Design' },
  { slug: 'politics', title: 'Politics' },
  { slug: 'ai', title: 'Artificial Intelligence' },
  { slug: 'privacy', title: 'Privacy' },
  { slug: 'startups', title: 'Startups' },
  { slug: 'accessibility', title: 'Accessibility' },
  { slug: 'data-science', title: 'Data Science' },
  { slug: 'writing', title: 'Writing' },
];

async function bootstrap() {
  console.log('🌱 Starting REALISTIC INTERCONNECTED seeding...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const neo4jService = app.get(Neo4jService);

  const userRepo = dataSource.getRepository(User);
  const postRepo = dataSource.getRepository(Post);
  const topicRepo = dataSource.getRepository(Topic);
  const postTopicRepo = dataSource.getRepository(PostTopic);
  const followRepo = dataSource.getRepository(Follow);
  const replyRepo = dataSource.getRepository(Reply);
  const likeRepo = dataSource.getRepository(Like);
  const keepRepo = dataSource.getRepository(Keep);
  const postEdgeRepo = dataSource.getRepository(PostEdge);
  const collectionRepo = dataSource.getRepository(Collection);
  const collectionItemRepo = dataSource.getRepository(CollectionItem);
  const notifPrefRepo = dataSource.getRepository(NotificationPref);
  const mentionRepo = dataSource.getRepository(Mention);
  const topicFollowRepo = dataSource.getRepository(TopicFollow);
  const inviteRepo = dataSource.getRepository(Invite);
  const systemSettingRepo = dataSource.getRepository(SystemSetting);
  const waitingListRepo = dataSource.getRepository(WaitingList);
  const followRequestRepo = dataSource.getRepository(FollowRequest);
  const reportRepo = dataSource.getRepository(Report);
  const blockRepo = dataSource.getRepository(Block);
  const muteRepo = dataSource.getRepository(Mute);
  const dmThreadRepo = dataSource.getRepository(DmThread);
  const dmMessageRepo = dataSource.getRepository(DmMessage);
  const pushTokenRepo = dataSource.getRepository(PushToken);

  try {
    // --- CLEANUP (child tables first, then roots; CASCADE handles FKs) ---
    console.log('🧹 Clearing DB...');
    await dataSource.query(`
      TRUNCATE TABLE
        collection_items, collections, mentions, external_sources,
        post_edges, keeps, likes, replies, post_topics, topic_follows,
        follows, follow_requests, posts, topics,
        notifications, blocks, mutes, reports, dm_messages, dm_threads,
        post_reads, push_outbox, push_tokens, notification_prefs,
        invites, waiting_list, system_settings, users
      RESTART IDENTITY CASCADE
    `);
    try {
      await neo4jService.run('MATCH (n) DETACH DELETE n');
    } catch (e) {}

    // --- 1. USERS (id set explicitly; UUID) ---
    console.log('👥 Creating users...');
    const userMap = new Map<string, User>();
    for (const p of PERSONAS) {
      const user = userRepo.create({
        id: p.id,
        handle: p.handle,
        displayName: p.name,
        bio: p.bio,
        email: `${p.handle}@example.com`,
        languages: [p.lang],
        isProtected: p.isProtected,
        preferences: { theme: 'system', explore: p.explore },
      });
      await userRepo.save(user);
      userMap.set(p.handle, user);

      const pref = notifPrefRepo.create({
        userId: user.id,
        pushEnabled: true,
        replies: true,
        quotes: true,
        mentions: true,
        dms: true,
        follows: true,
        saves: true,
        ...(p.handle === 'marcus.phil' && {
          quietHoursStart: 22,
          quietHoursEnd: 7,
        }),
      });
      await notifPrefRepo.save(pref);

      try {
        await neo4jService.run(
          `MERGE (u:User {id: $id}) SET u.handle = $handle`,
          { id: user.id, handle: user.handle },
        );
      } catch (e) {}
    }

    // --- 2. TOPICS (DB generates UUID) ---
    console.log('📚 Creating topics...');
    const topicMap = new Map<string, Topic>();
    const alex = userMap.get('alex.urban')!;
    for (const t of TOPICS) {
      const topic = topicRepo.create({
        slug: t.slug,
        title: t.title,
        createdBy: alex.id,
      });
      await topicRepo.save(topic);
      topicMap.set(t.slug, topic);
      try {
        await neo4jService.run(
          `MERGE (t:Topic {id: $id}) SET t.slug = $slug, t.title = $title`,
          { id: topic.id, slug: topic.slug, title: topic.title },
        );
      } catch (e) {}
    }

    // --- 3. SYSTEM SETTINGS, INVITES, WAITING LIST ---
    console.log('⚙️ System settings, invites, waiting list...');
    await systemSettingRepo.save({ key: 'beta_mode', value: 'true' });
    await systemSettingRepo.save({ key: 'maintenance_message', value: '' });

    await inviteRepo.save({
      code: 'SEED-OPEN-1',
      creatorId: alex.id,
      usedById: null,
      usedAt: null,
    });
    await inviteRepo.save({
      code: 'SEED-OPEN-2',
      creatorId: alex.id,
      usedById: null,
      usedAt: null,
    });
    await inviteRepo.save({
      code: 'SEED-USED-1',
      creatorId: alex.id,
      usedById: userMap.get('sarah.tech')!.id,
      usedAt: new Date(),
    });
    await inviteRepo.save({
      code: 'ADMIN-INVITE',
      creatorId: null,
      usedById: null,
      usedAt: null,
    });

    await waitingListRepo.save({
      email: 'waiting1@example.com',
      status: 'PENDING',
    });
    await waitingListRepo.save({
      email: 'waiting2@example.com',
      status: 'INVITED',
    });

    // --- 4. FOLLOWS (dense graph) ---
    console.log('🔗 Follows...');
    for (const u1 of PERSONAS) {
      for (const u2 of PERSONAS) {
        if (u1.id === u2.id) continue;
        if (Math.random() > 0.45) {
          await followRepo.save({ followerId: u1.id, followeeId: u2.id });
          try {
            await neo4jService.run(
              `MATCH (a:User {id:$a}), (b:User {id:$b}) MERGE (a)-[:FOLLOWS]->(b)`,
              { a: u1.id, b: u2.id },
            );
          } catch (e) {}
        }
      }
    }

    // --- 5. FOLLOW REQUESTS (protected accounts: mike, marcus, rebecca) ---
    console.log('📬 Follow requests...');
    const mike = userMap.get('mike.skeptic')!;
    const marcus = userMap.get('marcus.phil')!;
    const rebecca = userMap.get('rebecca.policy')!;
    await followRequestRepo.save({
      requesterId: userMap.get('sarah.tech')!.id,
      targetId: mike.id,
      status: FollowRequestStatus.APPROVED,
    });
    await followRequestRepo.save({
      requesterId: userMap.get('emily.green')!.id,
      targetId: mike.id,
      status: FollowRequestStatus.PENDING,
    });
    await followRequestRepo.save({
      requesterId: userMap.get('david.des')!.id,
      targetId: marcus.id,
      status: FollowRequestStatus.REJECTED,
    });
    const rebeccaUser = userMap.get('rebecca.policy')!;
    await followRequestRepo.save({
      requesterId: userMap.get('lisa.journo')!.id,
      targetId: rebeccaUser.id,
      status: FollowRequestStatus.APPROVED,
    });
    await followRequestRepo.save({
      requesterId: userMap.get('james.dev')!.id,
      targetId: rebeccaUser.id,
      status: FollowRequestStatus.PENDING,
    });

    // --- 6. TOPIC FOLLOWS ---
    console.log('📌 Topic follows...');
    for (const p of PERSONAS) {
      const user = userMap.get(p.handle)!;
      const topics = Array.from(topicMap.keys());
      for (let i = 0; i < 3 + Math.floor(Math.random() * 5); i++) {
        const slug = topics[Math.floor(Math.random() * topics.length)];
        const topic = topicMap.get(slug)!;
        await topicFollowRepo.save({ userId: user.id, topicId: topic.id });
        try {
          await neo4jService.run(
            `MATCH (u:User {id:$uid}), (t:Topic {id:$tid}) MERGE (u)-[:FOLLOWS_TOPIC]->(t)`,
            { uid: user.id, tid: topic.id },
          );
        } catch (e) {}
      }
    }

    // --- 7. POSTS (PUBLIC + FOLLOWERS, varied topics; DB generates UUID) ---
    console.log('📝 Posts...');
    const sarah = userMap.get('sarah.tech')!;
    const emily = userMap.get('emily.green')!;
    const david = userMap.get('david.des')!;
    const lisa = userMap.get('lisa.journo')!;
    const tom = userMap.get('tom.rust')!;
    const maria = userMap.get('maria.es')!;

    const postBodies: {
      author: string;
      title: string;
      body: string;
      visibility: PostVisibility;
      topics: string[];
      daysAgo: number;
    }[] = [
      {
        author: 'alex.urban',
        title: 'The Case for the 15-Minute City',
        body: "We need cities where everything is within a 15-minute walk or bike ride. This isn't about control; it's about **freedom** from the car. See [[urbanism]] and [[design]].",
        visibility: PostVisibility.PUBLIC,
        topics: ['urbanism', 'design'],
        daysAgo: 5,
      },
      {
        author: 'mike.skeptic',
        title: 'Hidden Restrictions',
        body: 'Heavy zoning against cars feels like control. What about rural connectivity? I disagree with the premise of the 15-minute city push.',
        visibility: PostVisibility.PUBLIC,
        topics: ['urbanism', 'politics'],
        daysAgo: 4,
      },
      {
        author: 'sarah.tech',
        title: 'Memory Safety in 2026',
        body: 'Why I moved our core loop to [[rust]]. It eliminates an entire class of bugs. Code sample: `fn main() { println!("Hello, safety!"); }`',
        visibility: PostVisibility.PUBLIC,
        topics: ['rust', 'technology'],
        daysAgo: 6,
      },
      {
        author: 'emily.green',
        title: 'Latest Climate Models',
        body: 'New data on ocean heat uptake. We need to act faster. [[climate]]',
        visibility: PostVisibility.PUBLIC,
        topics: ['climate'],
        daysAgo: 3,
      },
      {
        author: 'david.des',
        title: 'Design is Political',
        body: 'Watching the urbanism debate highlights a core tension in [[design]]. We need accessible cities that prioritize pedestrians without alienating drivers.',
        visibility: PostVisibility.PUBLIC,
        topics: ['design', 'urbanism'],
        daysAgo: 2,
      },
      {
        author: 'lisa.journo',
        title: 'Future of Work Survey',
        body: 'We surveyed 500 remote workers. Key finding: flexibility beats salary for many. [[technology]]',
        visibility: PostVisibility.PUBLIC,
        topics: ['technology'],
        daysAgo: 4,
      },
      {
        author: 'marcus.phil',
        title: 'Stoicism and Social Media',
        body: 'Focus on what you can control. Your feed is not one of them. Memento mori.',
        visibility: PostVisibility.FOLLOWERS,
        topics: [],
        daysAgo: 7,
      },
      {
        author: 'maria.es',
        title: 'Diseño urbano en Barcelona',
        body: 'Superilles y menos coches. La ciudad para las personas. [[urbanism]] [[design]]',
        visibility: PostVisibility.PUBLIC,
        topics: ['urbanism', 'design'],
        daysAgo: 3,
      },
      {
        author: 'tom.rust',
        title: 'Rust 2026 Edition Notes',
        body: 'Proposed changes for the next edition. Better async ergonomics and const generics. [[rust]]',
        visibility: PostVisibility.PUBLIC,
        topics: ['rust'],
        daysAgo: 1,
      },
      {
        author: 'yuki.jp',
        title: 'Privacy by Design',
        body: "Encryption should be default. Here's how we approach identity. [[privacy]] [[technology]]",
        visibility: PostVisibility.PUBLIC,
        topics: ['privacy', 'technology'],
        daysAgo: 2,
      },
      {
        author: 'anna.art',
        title: 'Generative Art with Code',
        body: 'Using noise and recursion. Link to my latest piece. [[design]]',
        visibility: PostVisibility.PUBLIC,
        topics: ['design'],
        daysAgo: 4,
      },
      {
        author: 'james.dev',
        title: 'TypeScript Tips for Large Codebases',
        body: 'Strict mode, path aliases, and monorepos. What worked for us.',
        visibility: PostVisibility.PUBLIC,
        topics: ['technology'],
        daysAgo: 1,
      },
      {
        author: 'rebecca.policy',
        title: 'Platform Accountability',
        body: 'Why we need stronger rules for algorithmic transparency. [[politics]] [[technology]]',
        visibility: PostVisibility.FOLLOWERS,
        topics: ['politics', 'technology'],
        daysAgo: 3,
      },
      {
        author: 'fatima.data',
        title: 'ML Fairness in Hiring Tools',
        body: 'Bias in resume screening. What we found and how to fix. [[ai]] [[data-science]]',
        visibility: PostVisibility.PUBLIC,
        topics: ['ai', 'data-science'],
        daysAgo: 2,
      },
      {
        author: 'leo.writer',
        title: 'The Long Now of Tech',
        body: 'We think in quarters. We should think in decades. Essay on infrastructure and time. [[writing]]',
        visibility: PostVisibility.FOLLOWERS,
        topics: ['writing', 'technology'],
        daysAgo: 5,
      },
      {
        author: 'nina.design',
        title: 'Accessible Color Systems',
        body: 'Contrast ratios and semantic tokens. [[design]] [[accessibility]]',
        visibility: PostVisibility.PUBLIC,
        topics: ['design', 'accessibility'],
        daysAgo: 1,
      },
      {
        author: 'chris.indie',
        title: 'Bootstrapping Month 12',
        body: 'Revenue update and lessons. Still no VC. [[startups]]',
        visibility: PostVisibility.PUBLIC,
        topics: ['startups'],
        daysAgo: 0,
      },
      {
        author: 'oliver.news',
        title: 'Curated: Best of the Week',
        body: 'Five reads on urbanism, AI, and policy. Links only.',
        visibility: PostVisibility.PUBLIC,
        topics: ['urbanism', 'ai', 'politics'],
        daysAgo: 0,
      },
      {
        author: 'henry.teacher',
        title: 'Teaching Recursion',
        body: 'How I explain recursion to beginners. With diagrams.',
        visibility: PostVisibility.PUBLIC,
        topics: ['technology'],
        daysAgo: 2,
      },
      {
        author: 'zara.ux',
        title: 'Human-Centered AI',
        body: 'Research findings: when users trust (and distrust) recommendations. [[ai]] [[design]]',
        visibility: PostVisibility.PUBLIC,
        topics: ['ai', 'design'],
        daysAgo: 1,
      },
    ];

    const savedPosts: Post[] = [];
    for (const spec of postBodies) {
      const author = userMap.get(spec.author)!;
      const post = postRepo.create({
        authorId: author.id,
        title: spec.title,
        body: spec.body,
        visibility: spec.visibility,
        lang: spec.author === 'maria.es' ? 'es' : 'en',
        readingTimeMinutes: Math.max(1, Math.ceil(spec.body.length / 250)),
        createdAt: new Date(Date.now() - 86400000 * spec.daysAgo),
      });
      await postRepo.save(post);
      savedPosts.push(post);
      for (const slug of spec.topics) {
        const topic = topicMap.get(slug);
        if (topic) await linkTopic(postTopicRepo, neo4jService, post, topic);
      }
      await syncPost(neo4jService, post);
    }

    // Post edges (quotes/links) and mentions
    const postA1 = savedPosts[0];
    const postA2 = savedPosts[1];
    const postA3 = savedPosts[4];
    const postB1 = savedPosts[2];
    await createEdge(
      postEdgeRepo,
      neo4jService,
      postA2,
      postA1,
      EdgeType.QUOTE,
    );
    await createEdge(postEdgeRepo, neo4jService, postA3, postA1, EdgeType.LINK);
    await createEdge(postEdgeRepo, neo4jService, postA3, postA2, EdgeType.LINK);
    await mentionUser(mentionRepo, neo4jService, postA3, alex);
    await mentionUser(mentionRepo, neo4jService, postA3, mike);

    // --- 8. REPLIES (comment threads) ---
    console.log('💬 Replies...');
    await addReply(
      replyRepo,
      postRepo,
      userMap.get('alex.urban')!,
      postA2,
      "Mike, you're conflating zoning with restriction. It's about mixed-use.",
      4,
    );
    const r1 = await addReply(
      replyRepo,
      postRepo,
      mike,
      postA2,
      'Mixed-use often prices out local businesses.',
      3.8,
    );
    await addReply(
      replyRepo,
      postRepo,
      david,
      postA2,
      'Data shows mixed-use increases foot traffic for small biz.',
      3.6,
      r1.id,
    );
    await addReply(
      replyRepo,
      postRepo,
      userMap.get('lisa.journo')!,
      postB1,
      'Great breakdown. Would love to interview you on this.',
      5.5,
    );
    await addReply(
      replyRepo,
      postRepo,
      tom,
      postB1,
      'Thanks! Happy to chat.',
      5.2,
    );
    for (let i = 0; i < savedPosts.length; i++) {
      if (i % 3 === 0 && savedPosts[i].authorId !== alex.id) {
        await addReply(
          replyRepo,
          postRepo,
          alex,
          savedPosts[i],
          'Really enjoyed this. Thanks for sharing.',
          savedPosts[i].createdAt
            ? (Date.now() - savedPosts[i].createdAt.getTime()) / 86400000 - 0.1
            : 1,
        );
      }
    }

    // --- 9. LIKES & KEEPS ---
    console.log('❤️ Likes & keeps...');
    for (const post of savedPosts) {
      for (const p of PERSONAS) {
        if (Math.random() > 0.5) {
          await likeRepo.save({ userId: p.id, postId: post.id });
          await postRepo.increment({ id: post.id }, 'privateLikeCount', 1);
        }
        if (Math.random() > 0.75)
          await keepRepo.save({ userId: p.id, postId: post.id });
      }
    }

    // --- 10. COLLECTIONS (public + private) ---
    console.log('📁 Collections...');
    const lisaUser = userMap.get('lisa.journo')!;
    const colPublic = collectionRepo.create({
      ownerId: lisaUser.id,
      title: 'Future of Code',
      description: 'Memory-safe languages and systems.',
      isPublic: true,
      shareSaves: true,
    });
    await collectionRepo.save(colPublic);
    await collectionItemRepo.save({
      collectionId: colPublic.id,
      postId: postB1.id,
      curatorNote: 'The definitive argument for Rust.',
      sortOrder: 0,
    });
    await keepRepo.save({ userId: lisaUser.id, postId: postB1.id });

    const colPrivate = collectionRepo.create({
      ownerId: userMap.get('rebecca.policy')!.id,
      title: 'Policy Reads',
      description: 'Private reading list.',
      isPublic: false,
      shareSaves: false,
    });
    await collectionRepo.save(colPrivate);
    await collectionItemRepo.save({
      collectionId: colPrivate.id,
      postId: savedPosts[12].id,
      curatorNote: 'For follow-up.',
      sortOrder: 0,
    });

    const colDesign = collectionRepo.create({
      ownerId: david.id,
      title: 'Design References',
      description: 'A11y and design systems.',
      isPublic: true,
      shareSaves: true,
    });
    await collectionRepo.save(colDesign);
    await collectionItemRepo.save({
      collectionId: colDesign.id,
      postId: savedPosts[4].id,
      curatorNote: null,
      sortOrder: 0,
    });
    await collectionItemRepo.save({
      collectionId: colDesign.id,
      postId: savedPosts[14].id,
      curatorNote: 'Color contrast.',
      sortOrder: 1,
    });

    // --- 11. REPORTS (flags: POST, REPLY, USER; statuses) ---
    console.log('🚩 Reports...');
    await reportRepo.save({
      reporterId: userMap.get('oliver.news')!.id,
      targetType: ReportTargetType.POST,
      targetId: postA2.id,
      reason: 'Spam',
      status: ReportStatus.DISMISSED,
    });
    const firstReplyOnA2 = await replyRepo.findOne({
      where: { postId: postA2.id },
    });
    if (firstReplyOnA2)
      await reportRepo.save({
        reporterId: userMap.get('anna.art')!.id,
        targetType: ReportTargetType.REPLY,
        targetId: firstReplyOnA2.id,
        reason: 'Harassment',
        status: ReportStatus.OPEN,
      });
    await reportRepo.save({
      reporterId: userMap.get('james.dev')!.id,
      targetType: ReportTargetType.USER,
      targetId: mike.id,
      reason: 'Impersonation',
      status: ReportStatus.REVIEWED,
    });
    await reportRepo.save({
      reporterId: userMap.get('emily.green')!.id,
      targetType: ReportTargetType.POST,
      targetId: savedPosts[3].id,
      reason: 'Misinformation',
      status: ReportStatus.ACTIONED,
    });

    // --- 12. BLOCKS & MUTES ---
    console.log('🚫 Blocks & mutes...');
    await blockRepo.save({
      blockerId: mike.id,
      blockedId: userMap.get('oliver.news')!.id,
    });
    await blockRepo.save({
      blockerId: rebeccaUser.id,
      blockedId: userMap.get('chris.indie')!.id,
    });
    await muteRepo.save({
      muterId: lisaUser.id,
      mutedId: userMap.get('tom.rust')!.id,
    });
    await muteRepo.save({
      muterId: marcus.id,
      mutedId: userMap.get('anna.art')!.id,
    });

    // --- 13. DM THREADS & MESSAGES ---
    console.log('✉️ DMs...');
    const thread1 = await dmThreadRepo.save(
      dmThreadRepo.create({ userA: alex.id, userB: sarah.id }),
    );
    await dmMessageRepo.save(
      dmMessageRepo.create({
        threadId: thread1.id,
        senderId: alex.id,
        body: 'Hey, want to collaborate on a post about urbanism and tech?',
      }),
    );
    await dmMessageRepo.save(
      dmMessageRepo.create({
        threadId: thread1.id,
        senderId: sarah.id,
        body: 'Sure! When do you want to draft?',
      }),
    );
    await dmMessageRepo.save(
      dmMessageRepo.create({
        threadId: thread1.id,
        senderId: alex.id,
        body: 'How about next week?',
      }),
    );

    const thread2 = await dmThreadRepo.save(
      dmThreadRepo.create({
        userA: david.id,
        userB: userMap.get('nina.design')!.id,
      }),
    );
    await dmMessageRepo.save(
      dmMessageRepo.create({
        threadId: thread2.id,
        senderId: david.id,
        body: 'Loved your post on color systems.',
      }),
    );
    await dmMessageRepo.save(
      dmMessageRepo.create({
        threadId: thread2.id,
        senderId: userMap.get('nina.design')!.id,
        body: 'Thank you! Let me know if you want to reference it.',
      }),
    );

    const thread3 = await dmThreadRepo.save(
      dmThreadRepo.create({
        userA: emily.id,
        userB: userMap.get('yuki.jp')!.id,
      }),
    );
    await dmMessageRepo.save(
      dmMessageRepo.create({
        threadId: thread3.id,
        senderId: emily.id,
        body: 'Could we chat about privacy and climate data?',
      }),
    );

    // --- 14. PUSH TOKENS (sample) ---
    console.log('📱 Push tokens...');
    await pushTokenRepo.save(
      pushTokenRepo.create({
        userId: alex.id,
        provider: PushProvider.FCM,
        token: 'seed-fcm-token-alex',
        platform: 'web',
        locale: 'en',
      }),
    );
    await pushTokenRepo.save(
      pushTokenRepo.create({
        userId: sarah.id,
        provider: PushProvider.APNS,
        token: 'seed-apns-token-sarah',
        platform: 'ios',
        locale: 'en',
      }),
    );

    // --- 15. USER COUNTS (follower_count, following_count) ---
    console.log('📊 Updating user counts...');
    for (const p of PERSONAS) {
      const userId = p.id;
      const followerCount = await followRepo.count({
        where: { followeeId: userId },
      });
      const followingCount = await followRepo.count({
        where: { followerId: userId },
      });
      await userRepo.update({ id: userId }, { followerCount, followingCount });
    }

    console.log('\n✅ SEEDING COMPLETE');
    console.log(
      '   Users (public/private, custom explore prefs), Topics, Invites, Waiting list',
    );
    console.log('   Follows, Follow requests, Topic follows');
    console.log('   Posts (PUBLIC/FOLLOWERS), Replies, Likes, Keeps');
    console.log('   Collections (public + private), Reports, Blocks, Mutes');
    console.log('   DMs, Push tokens, Neo4j synced.');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

async function syncPost(neo4j: Neo4jService, post: Post) {
  try {
    await neo4j.run(
      `MATCH (u:User {id: $uid}) MERGE (p:Post {id: $pid}) SET p.createdAt = $cat MERGE (u)-[:AUTHORED]->(p)`,
      { uid: post.authorId, pid: post.id, cat: post.createdAt.toISOString() },
    );
  } catch (e) {}
}

async function linkTopic(
  repo: any,
  neo4j: Neo4jService,
  post: Post,
  topic: Topic,
) {
  if (!topic) return;
  await repo.save({ postId: post.id, topicId: topic.id });
  try {
    await neo4j.run(
      `MATCH (p:Post {id: $pid}), (t:Topic {id: $tid}) MERGE (p)-[:IN_TOPIC]->(t)`,
      { pid: post.id, tid: topic.id },
    );
  } catch (e) {}
}

async function createEdge(
  repo: any,
  neo4j: Neo4jService,
  from: Post,
  to: Post,
  type: EdgeType,
) {
  await repo.save({ fromPostId: from.id, toPostId: to.id, edgeType: type });
  const rel = type === EdgeType.QUOTE ? 'QUOTES' : 'LINKS_TO';
  try {
    await neo4j.run(
      `MATCH (a:Post {id: $a}), (b:Post {id: $b}) MERGE (a)-[:${rel}]->(b)`,
      { a: from.id, b: to.id },
    );
  } catch (e) {}
}

async function addReply(
  repo: any,
  postRepo: any,
  author: User,
  parentPost: Post,
  body: string,
  daysAgo: number,
  parentReplyId?: string,
) {
  const reply = repo.create({
    postId: parentPost.id,
    authorId: author.id,
    body,
    parentReplyId,
    createdAt: new Date(Date.now() - 86400000 * daysAgo),
  });
  const saved = await repo.save(reply);
  await postRepo.increment({ id: parentPost.id }, 'replyCount', 1);
  return saved;
}

async function mentionUser(
  repo: any,
  neo4j: Neo4jService,
  post: Post,
  user: User,
) {
  await repo.save({ postId: post.id, mentionedUserId: user.id });
  try {
    await neo4j.run(
      `MATCH (p:Post {id: $pid}), (u:User {id: $uid}) MERGE (p)-[:MENTIONS]->(u)`,
      { pid: post.id, uid: user.id },
    );
  } catch (e) {}
}

bootstrap();
