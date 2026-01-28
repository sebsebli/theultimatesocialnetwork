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
import { ExternalSource } from './entities/external-source.entity';
import { TopicFollow } from './entities/topic-follow.entity';
import { Invite } from './entities/invite.entity';
import { SystemSetting } from './entities/system-setting.entity';
import { WaitingList } from './entities/waiting-list.entity';
import { Neo4jService } from './database/neo4j.service';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

// Realistic sample data
const USER_NAMES = [
  {
    handle: 'alice_writer',
    displayName: 'Alice Writer',
    bio: 'Tech journalist and science communicator. Writing about AI, climate, and society.',
  },
  {
    handle: 'bob_researcher',
    displayName: 'Bob Researcher',
    bio: 'PhD in Computer Science. Researching distributed systems and consensus algorithms.',
  },
  {
    handle: 'charlie_thinker',
    displayName: 'Charlie Thinker',
    bio: 'Philosopher exploring ethics in technology. Long-form essays on digital culture.',
  },
  {
    handle: 'diana_curator',
    displayName: 'Diana Curator',
    bio: 'Curating the best long-form content on the web. Collections of deep dives.',
  },
  {
    handle: 'eve_developer',
    displayName: 'Eve Developer',
    bio: 'Full-stack developer. Building open-source tools and sharing learnings.',
  },
  {
    handle: 'frank_analyst',
    displayName: 'Frank Analyst',
    bio: 'Data analyst and visualization expert. Making sense of complex datasets.',
  },
  {
    handle: 'grace_designer',
    displayName: 'Grace Designer',
    bio: 'UX designer focused on accessibility and inclusive design principles.',
  },
  {
    handle: 'henry_historian',
    displayName: 'Henry Historian',
    bio: 'Digital historian. Exploring how technology shapes and is shaped by society.',
  },
  {
    handle: 'ivy_educator',
    displayName: 'Ivy Educator',
    bio: 'Online educator creating courses on programming, design, and critical thinking.',
  },
  {
    handle: 'jack_entrepreneur',
    displayName: 'Jack Entrepreneur',
    bio: 'Building the future of work. Sharing insights on startups and innovation.',
  },
  {
    handle: 'kate_scientist',
    displayName: 'Kate Scientist',
    bio: 'Climate scientist. Communicating research on climate change and solutions.',
  },
  {
    handle: 'liam_writer',
    displayName: 'Liam Writer',
    bio: 'Fiction and non-fiction writer. Exploring narrative structures and storytelling.',
  },
  {
    handle: 'mia_artist',
    displayName: 'Mia Artist',
    bio: 'Digital artist and creative coder. Blending art, technology, and philosophy.',
  },
  {
    handle: 'noah_engineer',
    displayName: 'Noah Engineer',
    bio: 'Systems engineer. Building reliable infrastructure and sharing war stories.',
  },
  {
    handle: 'olivia_philosopher',
    displayName: 'Olivia Philosopher',
    bio: 'Philosopher of mind and technology. Long-form essays on consciousness and AI.',
  },
  {
    handle: 'peter_economist',
    displayName: 'Peter Economist',
    bio: 'Behavioral economist. Researching decision-making and market dynamics.',
  },
  {
    handle: 'quinn_linguist',
    displayName: 'Quinn Linguist',
    bio: 'Computational linguist. Studying how language evolves in digital spaces.',
  },
  {
    handle: 'rachel_psychologist',
    displayName: 'Rachel Psychologist',
    bio: 'Social psychologist. Researching online communities and digital behavior.',
  },
  {
    handle: 'sam_architect',
    displayName: 'Sam Architect',
    bio: 'Software architect. Designing scalable systems and sharing patterns.',
  },
  {
    handle: 'taylor_activist',
    displayName: 'Taylor Activist',
    bio: 'Digital rights activist. Advocating for privacy, open source, and digital freedom.',
  },
  {
    handle: 'uma_curator',
    displayName: 'Uma Curator',
    bio: 'Content curator specializing in science communication and public understanding.',
  },
  {
    handle: 'vince_developer',
    displayName: 'Vince Developer',
    bio: 'Backend developer. Building APIs, databases, and distributed systems.',
  },
  {
    handle: 'willa_writer',
    displayName: 'Willa Writer',
    bio: 'Technical writer. Making complex topics accessible through clear documentation.',
  },
  {
    handle: 'xavier_researcher',
    displayName: 'Xavier Researcher',
    bio: 'AI researcher. Working on language models and their societal implications.',
  },
  {
    handle: 'yara_designer',
    displayName: 'Yara Designer',
    bio: 'Product designer. Creating interfaces that are both beautiful and functional.',
  },
  {
    handle: 'zoe_educator',
    displayName: 'Zoe Educator',
    bio: 'Online educator. Teaching programming, design, and critical thinking skills.',
  },
  {
    handle: 'alex_analyst',
    displayName: 'Alex Analyst',
    bio: 'Business analyst. Helping companies make data-driven decisions.',
  },
  {
    handle: 'blake_engineer',
    displayName: 'Blake Engineer',
    bio: 'DevOps engineer. Automating infrastructure and improving reliability.',
  },
  {
    handle: 'casey_thinker',
    displayName: 'Casey Thinker',
    bio: 'Independent researcher. Exploring the intersection of technology and society.',
  },
  {
    handle: 'dakota_writer',
    displayName: 'Dakota Writer',
    bio: 'Science writer. Translating complex research into engaging narratives.',
  },
  {
    handle: 'emery_developer',
    displayName: 'Emery Developer',
    bio: 'Frontend developer. Building responsive, accessible web applications.',
  },
  {
    handle: 'finley_curator',
    displayName: 'Finley Curator',
    bio: 'Content curator. Finding and sharing the best long-form content online.',
  },
  {
    handle: 'gray_analyst',
    displayName: 'Gray Analyst',
    bio: 'Security analyst. Researching vulnerabilities and defense strategies.',
  },
  {
    handle: 'hunter_researcher',
    displayName: 'Hunter Researcher',
    bio: 'Social science researcher. Studying online communities and digital culture.',
  },
  {
    handle: 'indigo_designer',
    displayName: 'Indigo Designer',
    bio: 'Interaction designer. Creating intuitive user experiences.',
  },
  {
    handle: 'jordan_engineer',
    displayName: 'Jordan Engineer',
    bio: 'ML engineer. Building and deploying machine learning systems.',
  },
  {
    handle: 'kendall_writer',
    displayName: 'Kendall Writer',
    bio: 'Tech journalist. Covering startups, innovation, and industry trends.',
  },
  {
    handle: 'logan_developer',
    displayName: 'Logan Developer',
    bio: 'Full-stack developer. Building web applications and APIs.',
  },
  {
    handle: 'morgan_thinker',
    displayName: 'Morgan Thinker',
    bio: 'Philosopher and writer. Exploring ethics, technology, and human nature.',
  },
  {
    handle: 'niko_curator',
    displayName: 'Niko Curator',
    bio: 'Content curator. Specializing in technology, science, and philosophy.',
  },
  {
    handle: 'parker_analyst',
    displayName: 'Parker Analyst',
    bio: 'Data analyst. Helping organizations understand their data.',
  },
  {
    handle: 'quinn_developer',
    displayName: 'Quinn Developer',
    bio: 'Mobile developer. Building iOS and Android applications.',
  },
  {
    handle: 'riley_writer',
    displayName: 'Riley Writer',
    bio: 'Long-form essayist. Writing about technology, culture, and society.',
  },
  {
    handle: 'sage_researcher',
    displayName: 'Sage Researcher',
    bio: 'Academic researcher. Publishing on digital humanities and computational methods.',
  },
  {
    handle: 'taylor_designer',
    displayName: 'Taylor Designer',
    bio: 'Visual designer. Creating brand identities and digital experiences.',
  },
  {
    handle: 'val_engineer',
    displayName: 'Val Engineer',
    bio: 'Systems engineer. Building and maintaining large-scale infrastructure.',
  },
  {
    handle: 'wren_curator',
    displayName: 'Wren Curator',
    bio: 'Content curator. Finding hidden gems in long-form writing.',
  },
  {
    handle: 'xara_analyst',
    displayName: 'Xara Analyst',
    bio: 'Business intelligence analyst. Creating dashboards and reports.',
  },
  {
    handle: 'yuki_developer',
    displayName: 'Yuki Developer',
    bio: 'Game developer. Creating interactive experiences and narratives.',
  },
  {
    handle: 'zane_writer',
    displayName: 'Zane Writer',
    bio: 'Technical writer. Documenting APIs, frameworks, and best practices.',
  },
];

const TOPICS = [
  { slug: 'artificial-intelligence', title: 'Artificial Intelligence' },
  { slug: 'climate-change', title: 'Climate Change' },
  { slug: 'web-development', title: 'Web Development' },
  { slug: 'philosophy', title: 'Philosophy' },
  { slug: 'data-science', title: 'Data Science' },
  { slug: 'design', title: 'Design' },
  { slug: 'startups', title: 'Startups' },
  { slug: 'open-source', title: 'Open Source' },
  { slug: 'privacy', title: 'Privacy' },
  { slug: 'education', title: 'Education' },
  { slug: 'society', title: 'Society' },
  { slug: 'technology', title: 'Technology' },
  { slug: 'science', title: 'Science' },
  { slug: 'culture', title: 'Culture' },
  { slug: 'ethics', title: 'Ethics' },
  { slug: 'innovation', title: 'Innovation' },
  { slug: 'research', title: 'Research' },
  { slug: 'writing', title: 'Writing' },
  { slug: 'programming', title: 'Programming' },
  { slug: 'history', title: 'History' },
];

// Classic short posts without titles (Twitter/X style)
const CLASSIC_POSTS = [
  'Just shipped a new feature. Feeling good! 🚀',
  'Anyone else find debugging oddly satisfying?',
  "The best code is code you don't have to write.",
  'Coffee + code = productivity. Change my mind.',
  'Spent 3 hours debugging. It was a typo. Classic.',
  "Why do we call it 'refactoring' when we're just fixing our mistakes?",
  "Documentation is like a good joke: if you have to explain it, it's not good.",
  "The only thing worse than no tests is tests that don't test anything.",
  "Code review: 'This could be simpler.' Me: 'Everything could be simpler.'",
  "I don't always test my code, but when I do, I do it in production.",
  'The best way to learn is to build something. Then break it. Then fix it.',
  'Stack Overflow: where I go to feel both smart and stupid at the same time.',
  "Git commit message: 'Fixed bug' - Future me: 'What bug?'",
  'The three hardest things in programming: naming things, cache invalidation, and off-by-one errors.',
  "Code is like humor. When you have to explain it, it's bad.",
  "Just realized I've been optimizing the wrong thing for the past week.",
  'The best error message is the one that tells you exactly what you did wrong.',
  "I write code that works. I don't write code that's easy to understand. That's a problem.",
  'The difference between a junior and senior developer: juniors write code that works. Seniors write code that works AND is maintainable.',
  "Why is it called 'pair programming' when I'm the only one typing?",
  'The best code is the code you delete.',
  "I'm not lazy, I'm just efficient at finding the easiest solution.",
  'The only thing more permanent than a temporary solution is a temporary solution that works.',
  "Debugging is like being a detective in a crime movie where you're also the murderer.",
  "I don't have a problem with procrastination. I have a problem with deadlines.",
  'The best way to get a good answer on Stack Overflow is to post a wrong answer.',
  'Code that works on my machine is the best kind of code.',
  "The three stages of learning to code: 1) It doesn't work. 2) It works but I don't know why. 3) It works and I know why.",
  "I'm not saying my code is perfect, but it's the best code I've written today.",
  'The best time to refactor is right after you finish the feature. The second best time is never.',
];

const POST_TEMPLATES = [
  {
    title: 'The Future of AI in Education',
    body: `# The Future of AI in Education

Artificial intelligence is transforming how we learn and teach. From personalized learning paths to automated grading, AI tools are becoming integral to educational systems worldwide.

## Personalized Learning

One of the most promising applications is personalized learning. AI can analyze a student's learning patterns and adapt content in real-time, ensuring each learner progresses at their optimal pace.

## Challenges Ahead

However, we must be cautious. Issues of [[privacy]], algorithmic bias, and the digital divide need careful consideration. The goal should be to enhance human teaching, not replace it.

What are your thoughts on AI in education?`,
    topics: ['artificial-intelligence', 'education'],
  },
  {
    title: 'Climate Solutions That Actually Work',
    body: `# Climate Solutions That Actually Work

After years of research and analysis, I've identified the most effective climate solutions based on scientific evidence.

## Renewable Energy Transition

The transition to renewable energy is accelerating. Solar and wind power are now cheaper than fossil fuels in most regions. This economic shift is driving rapid adoption.

## Carbon Capture and Storage

While controversial, carbon capture technologies are improving. Direct air capture facilities are becoming more efficient and cost-effective.

## Nature-Based Solutions

Reforestation and ecosystem restoration offer multiple benefits beyond carbon sequestration. They protect biodiversity and support local communities.

The key is implementing multiple solutions simultaneously. No single approach will solve the climate crisis alone.`,
    topics: ['climate-change', 'science'],
  },
  {
    title: 'Building Scalable Web Applications',
    body: `# Building Scalable Web Applications

Over the past decade, I've learned hard lessons about building applications that scale. Here's what actually matters.

## Start with the Right Architecture

Microservices aren't always the answer. Sometimes a well-designed monolith is the right choice. The key is understanding your requirements and constraints.

## Database Design Matters

Your database schema will make or break your application. Invest time in proper indexing, query optimization, and understanding your access patterns.

## Caching Strategies

Effective caching can reduce database load by 80-90%. Use Redis for session data, frequently accessed content, and computed results.

## Monitoring and Observability

You can't optimize what you can't measure. Implement comprehensive logging, metrics, and distributed tracing from day one.

The best architecture is the one that solves your specific problem, not the one that looks impressive on paper.`,
    topics: ['web-development', 'programming'],
  },
  {
    title: 'The Ethics of AI Development',
    body: `# The Ethics of AI Development

As AI systems become more powerful, the ethical implications become more complex. We need to have serious conversations about responsibility and accountability.

## Transparency and Explainability

Users deserve to know when they're interacting with AI systems. We need explainable AI that can justify its decisions, especially in high-stakes applications.

## Bias and Fairness

AI systems reflect the biases in their training data. We must actively work to identify and mitigate these biases, ensuring fair outcomes for all users.

## Privacy and Consent

Data collection for AI training raises serious privacy concerns. We need stronger consent mechanisms and better data governance.

## The Path Forward

The solution isn't to stop AI development, but to develop it responsibly. This requires interdisciplinary collaboration between technologists, ethicists, policymakers, and affected communities.

What principles should guide AI development?`,
    topics: ['artificial-intelligence', 'ethics', 'philosophy'],
  },
  {
    title: 'The Open Source Movement in 2024',
    body: `# The Open Source Movement in 2024

Open source software has fundamentally changed how we build technology. But the movement faces new challenges and opportunities.

## Sustainability

Many critical open source projects are maintained by volunteers. We need sustainable funding models that support maintainers while preserving the open source ethos.

## Corporate Involvement

Large tech companies contribute significantly to open source, but their motivations are complex. We must balance corporate support with community autonomy.

## Licensing Evolution

New licenses are emerging to address AI training, cloud usage, and other modern concerns. The licensing landscape is more complex than ever.

## Community Health

Healthy communities are the foundation of successful open source projects. We need better tools and practices for community management and conflict resolution.

The future of open source depends on finding the right balance between openness, sustainability, and practical constraints.`,
    topics: ['open-source', 'technology'],
  },
  {
    title: 'Understanding Privacy in the Digital Age',
    body: `# Understanding Privacy in the Digital Age

Privacy is a fundamental right, but it's under constant threat in our digital world. We need to rethink how we protect personal information.

## The Value of Privacy

Privacy isn't about hiding wrongdoing—it's about autonomy and control over our personal information. It enables free expression and protects vulnerable populations.

## Current Threats

Surveillance capitalism, data breaches, and government surveillance all threaten privacy. The scale and sophistication of these threats are unprecedented.

## Technical Solutions

Encryption, zero-knowledge proofs, and privacy-preserving technologies offer technical solutions. But technology alone isn't enough.

## Legal and Social Frameworks

We need stronger legal protections and cultural shifts that value privacy. GDPR is a start, but we need global standards and enforcement.

## What You Can Do

Use privacy-focused tools, support organizations fighting for digital rights, and advocate for stronger privacy protections.

Privacy is worth fighting for.`,
    topics: ['privacy', 'society'],
  },
  {
    title: 'The Art of Long-Form Writing',
    body: `# The Art of Long-Form Writing

In an age of tweets and short-form content, long-form writing offers something unique: depth, nuance, and the space to explore complex ideas.

## Why Long-Form Matters

Long-form writing allows for complexity. It can explore multiple perspectives, provide context, and build arguments over thousands of words.

## The Writing Process

Good long-form writing requires research, structure, and revision. It's a craft that takes time to develop.

## Finding Your Voice

Your unique perspective is your greatest asset. Don't try to sound like someone else—develop your own authentic voice.

## The Reader's Journey

Think about the reader's experience. How do you guide them through your ideas? What questions do you answer? What emotions do you evoke?

Long-form writing is a conversation with the reader, stretched over time and space.`,
    topics: ['writing', 'culture'],
  },
  {
    title: 'Data Science in Practice',
    body: `# Data Science in Practice

Data science is more than just machine learning models. It's about asking the right questions and telling compelling stories with data.

## The Scientific Method

Good data science follows the scientific method: hypothesis, experimentation, analysis, and interpretation. Don't skip steps.

## Data Quality

Garbage in, garbage out. Invest time in data cleaning, validation, and understanding your data sources.

## Visualization

A good visualization can communicate insights more effectively than pages of analysis. Learn to create clear, honest visualizations.

## Communication

Technical skills are important, but communication skills are essential. You need to explain your findings to non-technical stakeholders.

## Ethics

Data science has real-world consequences. Consider the ethical implications of your work, from privacy to algorithmic bias.

Data science is a tool for understanding the world. Use it responsibly.`,
    topics: ['data-science', 'research'],
  },
  {
    title: 'Designing for Accessibility',
    body: `# Designing for Accessibility

Accessibility isn't an afterthought—it's a fundamental requirement for good design. When we design for accessibility, we design for everyone.

## Universal Design Principles

Universal design benefits everyone, not just people with disabilities. Curb cuts help wheelchair users, parents with strollers, and people with luggage.

## Web Accessibility

WCAG guidelines provide a framework for accessible web design. Color contrast, keyboard navigation, and screen reader compatibility are essential.

## Inclusive Design Process

Include people with disabilities in your design process. Their insights will improve your product for all users.

## Beyond Compliance

Accessibility is more than checking boxes. It's about creating experiences that are truly usable by everyone.

## The Business Case

Accessible design expands your audience, improves SEO, and reduces legal risk. It's not just the right thing to do—it's good business.

Design with accessibility in mind from the start, and you'll create better products for everyone.`,
    topics: ['design', 'society'],
  },
  {
    title: 'The Startup Journey',
    body: `# The Startup Journey

Starting a company is one of the most challenging and rewarding experiences. Here's what I've learned from building multiple startups.

## The Idea

Ideas are cheap. Execution is everything. Don't fall in love with your idea—fall in love with solving a real problem.

## Building the Team

Your team is your most important asset. Hire for culture fit, growth potential, and complementary skills.

## Product-Market Fit

Finding product-market fit is the hardest part. It requires constant iteration, customer feedback, and the willingness to pivot.

## Fundraising

Fundraising is a means to an end, not the goal. Focus on building a sustainable business, not just raising money.

## The Long Game

Most startups fail. Success requires persistence, adaptability, and a bit of luck. Keep learning, keep iterating, and don't give up.

The startup journey is a marathon, not a sprint.`,
    topics: ['startups', 'innovation'],
  },
];

const REPLY_TEMPLATES = [
  'Great point! I think this connects to what you mentioned about...',
  'I have a different perspective on this. What if we consider...',
  'This reminds me of a similar situation I encountered...',
  "Could you elaborate on that? I'm particularly interested in...",
  "I agree, but I'd also add that...",
  'Interesting take. I wonder if we should also consider...',
  "Thanks for sharing this. It's given me a lot to think about.",
  "I see what you mean, though I think there's another angle...",
  'This is a really important point that often gets overlooked.',
  "I've been thinking about this too. Here's what I've found...",
];

async function bootstrap() {
  console.log('🌱 Starting comprehensive data seeding...');

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
  const mentionRepo = dataSource.getRepository(Mention);
  const externalSourceRepo = dataSource.getRepository(ExternalSource);
  const topicFollowRepo = dataSource.getRepository(TopicFollow);
  const inviteRepo = dataSource.getRepository(Invite);
  const settingsRepo = dataSource.getRepository(SystemSetting);
  const waitingListRepo = dataSource.getRepository(WaitingList);

  try {
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🧹 Clearing existing data...');
    // Use TRUNCATE for efficient deletion - order matters due to foreign keys
    await dataSource.query(`
      TRUNCATE TABLE 
        collection_items, collections, mentions, external_sources, 
        post_edges, keeps, likes, replies, post_topics, topic_follows, 
        follows, posts, topics, invites, waiting_list, system_settings, 
        users, notifications, blocks, mutes, reports, dm_messages, dm_threads,
        post_reads, push_outbox, push_tokens, notification_prefs, follow_requests
      RESTART IDENTITY CASCADE
    `);

    // 1. Create Users
    console.log('👥 Creating users...');
    const users: User[] = [];
    for (const userData of USER_NAMES) {
      const user = userRepo.create({
        id: uuidv4(),
        handle: userData.handle,
        displayName: userData.displayName,
        bio: userData.bio,
        email: `${userData.handle}@example.com`,
        languages: ['en'],
        isProtected: Math.random() < 0.1, // 10% protected accounts
        invitesRemaining: Math.floor(Math.random() * 5),
      });
      const savedUser = await userRepo.save(user);
      users.push(savedUser);

      // Sync to Neo4j: User node
      try {
        await neo4jService.run(
          `MERGE (u:User {id: $userId}) SET u.handle = $handle`,
          { userId: savedUser.id, handle: savedUser.handle },
        );
      } catch (e) {
        console.warn(
          `Failed to sync user ${savedUser.id} to Neo4j:`,
          e.message,
        );
      }
    }
    console.log(`✅ Created ${users.length} users`);

    // 2. Create Topics
    console.log('📚 Creating topics...');
    const topics: Topic[] = [];
    for (const topicData of TOPICS) {
      const topic = topicRepo.create({
        slug: topicData.slug,
        title: topicData.title,
        createdBy: users[Math.floor(Math.random() * users.length)].id,
      });
      const savedTopic = await topicRepo.save(topic);
      topics.push(savedTopic);

      // Sync to Neo4j: Topic node
      try {
        await neo4jService.run(
          `MERGE (t:Topic {id: $topicId}) SET t.slug = $slug, t.title = $title`,
          {
            topicId: savedTopic.id,
            slug: savedTopic.slug,
            title: savedTopic.title,
          },
        );
      } catch (e) {
        console.warn(
          `Failed to sync topic ${savedTopic.id} to Neo4j:`,
          e.message,
        );
      }
    }
    console.log(`✅ Created ${topics.length} topics`);

    // 3. Create Follows (realistic network)
    console.log('🔗 Creating follow relationships...');
    let followCount = 0;
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      // Each user follows 5-15 other users
      const numFollows = Math.floor(Math.random() * 11) + 5;
      const followed = new Set<string>();
      followed.add(user.id); // Don't follow self

      for (let j = 0; j < numFollows; j++) {
        let targetIndex = Math.floor(Math.random() * users.length);
        while (followed.has(users[targetIndex].id)) {
          targetIndex = Math.floor(Math.random() * users.length);
        }
        followed.add(users[targetIndex].id);

        const follow = followRepo.create({
          followerId: user.id,
          followeeId: users[targetIndex].id,
        });
        await followRepo.save(follow);
        followCount++;

        // Sync to Neo4j: User -> User (FOLLOWS)
        try {
          await neo4jService.run(
            `
            MERGE (u1:User {id: $followerId})
            MERGE (u2:User {id: $followeeId})
            MERGE (u1)-[:FOLLOWS]->(u2)
            `,
            { followerId: user.id, followeeId: users[targetIndex].id },
          );
        } catch (e) {
          console.warn(
            `Failed to sync follow relationship to Neo4j:`,
            e.message,
          );
        }
      }
    }
    console.log(`✅ Created ${followCount} follow relationships`);

    // Update follower/following counts
    for (const user of users) {
      const followerCount = await followRepo.count({
        where: { followeeId: user.id },
      });
      const followingCount = await followRepo.count({
        where: { followerId: user.id },
      });
      await userRepo.update(user.id, { followerCount, followingCount });
    }

    // 4. Create Topic Follows
    console.log('📌 Creating topic follows...');
    let topicFollowCount = 0;
    for (const user of users) {
      // Each user follows 2-6 topics
      const numTopics = Math.floor(Math.random() * 5) + 2;
      const followedTopics = new Set<string>();

      for (let i = 0; i < numTopics; i++) {
        const topic = topics[Math.floor(Math.random() * topics.length)];
        if (!followedTopics.has(topic.id)) {
          followedTopics.add(topic.id);
          const topicFollow = topicFollowRepo.create({
            userId: user.id,
            topicId: topic.id,
          });
          await topicFollowRepo.save(topicFollow);
          topicFollowCount++;
        }
      }
    }
    console.log(`✅ Created ${topicFollowCount} topic follows`);

    // 5. Create Posts
    console.log('📝 Creating posts...');
    const posts: Post[] = [];
    const numPosts = 200; // Create 200 posts

    for (let i = 0; i < numPosts; i++) {
      const author = users[Math.floor(Math.random() * users.length)];

      // 30% chance of classic post (no title), 70% chance of long-form post (with title)
      const isClassicPost = Math.random() < 0.3;

      let body: string;
      let title: string | null = null;

      let topicsToAdd: string[] = [];

      if (isClassicPost) {
        // Classic post without title
        body = CLASSIC_POSTS[Math.floor(Math.random() * CLASSIC_POSTS.length)];
        // Classic posts can have random topics
        const randomTopics = ['programming', 'technology', 'web-development'];
        topicsToAdd = [
          randomTopics[Math.floor(Math.random() * randomTopics.length)],
        ];
      } else {
        // Long-form post with title
        const template =
          POST_TEMPLATES[Math.floor(Math.random() * POST_TEMPLATES.length)];
        body = template.body.replace(/\[\[privacy\]\]/g, '[[Privacy]]');
        topicsToAdd = template.topics;

        // Extract title from body if present
        const titleMatch = body.match(/^#\s+(.+)$/m);
        title = titleMatch ? titleMatch[1].trim() : null;
      }

      const post = postRepo.create({
        id: uuidv4(),
        authorId: author.id,
        body: body,
        title: title,
        visibility:
          Math.random() < 0.9
            ? PostVisibility.PUBLIC
            : PostVisibility.FOLLOWERS,
        lang: 'en',
        langConfidence: 0.95,
        readingTimeMinutes: Math.ceil(body.split(/\s+/).length / 200),
        createdAt: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
        ), // Random time in last 30 days
      });

      const savedPost = await postRepo.save(post);
      posts.push(savedPost);

      // Sync to Neo4j: User -> Post (AUTHORED)
      try {
        await neo4jService.run(
          `
          MERGE (u:User {id: $userId})
          MERGE (p:Post {id: $postId})
          SET p.createdAt = $createdAt
          MERGE (u)-[:AUTHORED]->(p)
          `,
          {
            userId: author.id,
            postId: savedPost.id,
            createdAt: savedPost.createdAt.toISOString(),
          },
        );
      } catch (e) {
        console.warn(
          `Failed to sync post ${savedPost.id} to Neo4j:`,
          e.message,
        );
      }

      // Add topics to post
      for (const topicSlug of topicsToAdd) {
        const topic = topics.find((t) => t.slug === topicSlug);
        if (topic) {
          const postTopic = postTopicRepo.create({
            postId: savedPost.id,
            topicId: topic.id,
          });
          await postTopicRepo.save(postTopic);

          // Sync to Neo4j: Post -> Topic (IN_TOPIC)
          try {
            await neo4jService.run(
              `
              MERGE (p:Post {id: $postId})
              MERGE (t:Topic {id: $topicId})
              MERGE (p)-[:IN_TOPIC]->(t)
              `,
              { postId: savedPost.id, topicId: topic.id },
            );
          } catch (e) {
            console.warn(
              `Failed to sync post-topic relationship to Neo4j:`,
              e.message,
            );
          }
        }
      }

      // Add external sources (30% of posts)
      if (Math.random() < 0.3) {
        const source = externalSourceRepo.create({
          postId: savedPost.id,
          url: `https://example.com/article-${i}`,
          canonicalUrl: `https://example.com/article-${i}`,
          title: `Source Article ${i}`,
        });
        await externalSourceRepo.save(source);
      }

      // Add mentions (20% of posts)
      if (Math.random() < 0.2 && users.length > 1) {
        const mentionedUser = users[Math.floor(Math.random() * users.length)];
        if (mentionedUser.id !== author.id) {
          const mention = mentionRepo.create({
            postId: savedPost.id,
            mentionedUserId: mentionedUser.id,
          });
          await mentionRepo.save(mention);
        }
      }
    }
    console.log(`✅ Created ${posts.length} posts`);

    // 6. Create Post Edges (links and quotes)
    console.log('🔗 Creating post edges (links and quotes)...');
    let edgeCount = 0;
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];

      // 30% of posts link to other posts
      if (Math.random() < 0.3 && posts.length > 1) {
        const targetPost = posts[Math.floor(Math.random() * posts.length)];
        if (targetPost.id !== post.id) {
          const edge = postEdgeRepo.create({
            fromPostId: post.id,
            toPostId: targetPost.id,
            edgeType: EdgeType.LINK,
            anchorText: 'related post',
          });
          await postEdgeRepo.save(edge);
          edgeCount++;

          // Sync to Neo4j: Post -> Post (LINKS_TO)
          try {
            await neo4jService.run(
              `
              MERGE (p1:Post {id: $fromId})
              MERGE (p2:Post {id: $toId})
              MERGE (p1)-[:LINKS_TO]->(p2)
              `,
              { fromId: post.id, toId: targetPost.id },
            );
          } catch (e) {
            console.warn(`Failed to sync link edge to Neo4j:`, e.message);
          }
        }
      }

      // 15% of posts quote other posts
      if (Math.random() < 0.15 && posts.length > 1) {
        const quotedPost = posts[Math.floor(Math.random() * posts.length)];
        if (
          quotedPost.id !== post.id &&
          quotedPost.authorId !== post.authorId
        ) {
          const edge = postEdgeRepo.create({
            fromPostId: post.id,
            toPostId: quotedPost.id,
            edgeType: EdgeType.QUOTE,
          });
          await postEdgeRepo.save(edge);
          edgeCount++;

          // Update quote count
          await postRepo.increment({ id: quotedPost.id }, 'quoteCount', 1);

          // Sync to Neo4j: Post -> Post (QUOTES)
          try {
            await neo4jService.run(
              `
              MERGE (p1:Post {id: $fromId})
              MERGE (p2:Post {id: $toId})
              MERGE (p1)-[:QUOTES]->(p2)
              `,
              { fromId: post.id, toId: quotedPost.id },
            );
          } catch (e) {
            console.warn(`Failed to sync quote edge to Neo4j:`, e.message);
          }
        }
      }
    }
    console.log(`✅ Created ${edgeCount} post edges`);

    // 7. Create Replies
    console.log('💬 Creating replies...');
    let replyCount = 0;
    for (let i = 0; i < 150; i++) {
      const post = posts[Math.floor(Math.random() * posts.length)];
      const author = users[Math.floor(Math.random() * users.length)];
      const template =
        REPLY_TEMPLATES[Math.floor(Math.random() * REPLY_TEMPLATES.length)];

      const reply = replyRepo.create({
        id: uuidv4(),
        postId: post.id,
        authorId: author.id,
        body: template,
        lang: 'en',
        langConfidence: 0.9,
        createdAt: new Date(
          post.createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000,
        ), // Within 7 days of post
      });

      await replyRepo.save(reply);
      replyCount++;

      // Update reply count
      await postRepo.increment({ id: post.id }, 'replyCount', 1);
    }
    console.log(`✅ Created ${replyCount} replies`);

    // 8. Create Likes
    console.log('❤️ Creating likes...');
    let likeCount = 0;
    for (let i = 0; i < 300; i++) {
      const post = posts[Math.floor(Math.random() * posts.length)];
      const user = users[Math.floor(Math.random() * users.length)];

      // Check if like already exists
      const existing = await likeRepo.findOne({
        where: { userId: user.id, postId: post.id },
      });

      if (!existing) {
        const like = likeRepo.create({
          userId: user.id,
          postId: post.id,
        });
        await likeRepo.save(like);
        likeCount++;

        // Update like count
        await postRepo.increment({ id: post.id }, 'privateLikeCount', 1);
      }
    }
    console.log(`✅ Created ${likeCount} likes`);

    // 9. Create Keeps
    console.log('🔖 Creating keeps...');
    let keepCount = 0;
    for (let i = 0; i < 250; i++) {
      const post = posts[Math.floor(Math.random() * posts.length)];
      const user = users[Math.floor(Math.random() * users.length)];

      // Check if keep already exists
      const existing = await keepRepo.findOne({
        where: { userId: user.id, postId: post.id },
      });

      if (!existing) {
        const keep = keepRepo.create({
          userId: user.id,
          postId: post.id,
        });
        await keepRepo.save(keep);
        keepCount++;
      }
    }
    console.log(`✅ Created ${keepCount} keeps`);

    // 10. Create Collections
    console.log('📚 Creating collections...');
    const collections: Collection[] = [];
    for (let i = 0; i < 30; i++) {
      const owner = users[Math.floor(Math.random() * users.length)];
      const collection = collectionRepo.create({
        id: uuidv4(),
        ownerId: owner.id,
        title: `Collection ${i + 1}: ${TOPICS[Math.floor(Math.random() * TOPICS.length)].title}`,
        description: `A curated collection of posts on ${TOPICS[Math.floor(Math.random() * TOPICS.length)].title}`,
        isPublic: Math.random() < 0.7,
        shareSaves: Math.random() < 0.5,
      });
      collections.push(await collectionRepo.save(collection));
    }
    console.log(`✅ Created ${collections.length} collections`);

    // 11. Add items to collections
    console.log('📎 Adding items to collections...');
    let itemCount = 0;
    for (const collection of collections) {
      // Each collection has 3-10 items
      const numItems = Math.floor(Math.random() * 8) + 3;
      const addedPosts = new Set<string>();

      for (let i = 0; i < numItems; i++) {
        let post = posts[Math.floor(Math.random() * posts.length)];
        while (addedPosts.has(post.id)) {
          post = posts[Math.floor(Math.random() * posts.length)];
        }
        addedPosts.add(post.id);

        const item = collectionItemRepo.create({
          collectionId: collection.id,
          postId: post.id,
          curatorNote:
            Math.random() < 0.5
              ? `Why this matters: ${REPLY_TEMPLATES[Math.floor(Math.random() * REPLY_TEMPLATES.length)]}`
              : null,
          sortOrder: i,
        });
        await collectionItemRepo.save(item);
        itemCount++;
      }
    }
    console.log(`✅ Added ${itemCount} items to collections`);

    // 12. Set up Beta Mode and Invites
    console.log('🎫 Setting up beta mode and invites...');

    // Enable beta mode
    await settingsRepo.save({
      key: 'BETA_MODE',
      value: 'true',
    });
    console.log('✅ Beta mode enabled');

    // Create system invites (for testing)
    for (let i = 0; i < 10; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      await inviteRepo.save({
        code,
        creatorId: null, // System invite
      });
    }
    console.log('✅ Created 10 system invites');

    // Create user invites (some users generate invites)
    let userInviteCount = 0;
    for (let i = 0; i < Math.min(20, users.length); i++) {
      const user = users[i];
      if (user.invitesRemaining > 0) {
        const code = crypto.randomBytes(4).toString('hex').toUpperCase();
        await inviteRepo.save({
          code,
          creatorId: user.id,
        });
        userInviteCount++;
      }
    }
    console.log(`✅ Created ${userInviteCount} user invites`);

    // Add some waiting list entries
    for (let i = 0; i < 5; i++) {
      await waitingListRepo.save({
        email: `waitlist-${i}@example.com`,
        status: 'PENDING',
      });
    }
    console.log('✅ Added 5 waiting list entries');

    console.log('\n✅ Comprehensive seeding complete!');
    console.log(`\n📊 Summary:`);
    console.log(`   Users: ${users.length}`);
    console.log(`   Topics: ${topics.length}`);
    console.log(`   Posts: ${posts.length}`);
    console.log(`   Replies: ${replyCount}`);
    console.log(`   Likes: ${likeCount}`);
    console.log(`   Keeps: ${keepCount}`);
    console.log(`   Follows: ${followCount}`);
    console.log(`   Topic Follows: ${topicFollowCount}`);
    console.log(`   Post Edges: ${edgeCount}`);
    console.log(`   Collections: ${collections.length}`);
    console.log(`   Collection Items: ${itemCount}`);
    console.log(`   System Invites: 10`);
    console.log(`   User Invites: ${userInviteCount}`);
    console.log(`   Waiting List: 5`);
    console.log(`   Beta Mode: Enabled`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

bootstrap();
