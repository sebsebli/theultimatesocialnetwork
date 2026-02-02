import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../entities/user.entity';
import { AuthService } from '../auth/auth.service';
import { MeilisearchService } from '../search/meilisearch.service';
import { Neo4jService } from '../database/neo4j.service';

const HANDLE_REGEX = /^[a-z0-9_]{2,30}$/;

export interface SeedAgentDto {
  handle: string;
  displayName: string;
  bio?: string;
  /** Optional; default agent.{handle}@agents.local */
  email?: string;
  avatarKey?: string | null;
  profileHeaderKey?: string | null;
  /** Optional; default false. True = private/protected profile (follow requests). */
  isProtected?: boolean;
}

export interface SeedAgentResult {
  accessToken: string;
  user: { id: string; handle: string; displayName: string; email: string };
}

/**
 * Creates an agent user directly in the DB (no signup flow), indexes in Meilisearch,
 * creates the user node in Neo4j, and returns a JWT so the agent runner can call the API.
 */
@Injectable()
export class AdminAgentsService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private authService: AuthService,
    private meilisearch: MeilisearchService,
    private neo4j: Neo4jService,
  ) {}

  async seedAgent(dto: SeedAgentDto): Promise<SeedAgentResult> {
    const handle = dto.handle.trim().toLowerCase();
    if (!HANDLE_REGEX.test(handle)) {
      throw new BadRequestException(
        'Handle must be 2–30 chars: lowercase letters, numbers, underscore only.',
      );
    }
    const displayName = (dto.displayName ?? handle).trim().slice(0, 100);
    if (!displayName) {
      throw new BadRequestException('displayName is required.');
    }

    const email =
      (dto.email && dto.email.trim()) ||
      `agent.${handle}.${randomBytes(4).toString('hex')}@agents.local`;

    const existingHandle = await this.userRepo.findOne({
      where: { handle },
      select: ['id'],
    });
    if (existingHandle) {
      throw new ConflictException(`Handle "${handle}" is already taken.`);
    }
    const existingEmail = await this.userRepo.findOne({
      where: { email },
      select: ['id'],
    });
    if (existingEmail) {
      throw new ConflictException(`Email "${email}" is already in use.`);
    }

    const id = uuidv4();
    const publicId = randomBytes(9)
      .toString('base64')
      .replace(/\+/g, '.')
      .replace(/\//g, '_')
      .replace(/=/g, '')
      .substring(0, 12);

    const user = this.userRepo.create({
      id,
      publicId,
      email,
      handle,
      displayName,
      bio: (dto.bio ?? '').trim().slice(0, 500) || undefined,
      avatarKey: dto.avatarKey ?? undefined,
      profileHeaderKey: dto.profileHeaderKey ?? undefined,
      isProtected: dto.isProtected === true,
      invitesRemaining: 0,
      languages: [],
      followerCount: 0,
      followingCount: 0,
      quoteReceivedCount: 0,
      preferences: {},
      onboardingCompletedAt: new Date(),
    });
    await this.userRepo.save(user);

    await this.meilisearch.indexUser({
      id: user.id,
      handle: user.handle,
      displayName: user.displayName,
      bio: user.bio ?? undefined,
      avatarKey: user.avatarKey,
    });

    await this.neo4j.run('MERGE (u:User {id: $id})', { id: user.id });

    const tokens = await this.authService.generateTokens(user);
    return {
      accessToken: tokens.accessToken,
      user: {
        id: user.id,
        handle: user.handle,
        displayName: user.displayName,
        email: user.email,
      },
    };
  }

  /**
   * List users with email ending in @agents.local (for --resume-from-db).
   */
  async listAgentUsers(): Promise<
    { email: string; handle: string; displayName: string; bio: string }[]
  > {
    const users = await this.userRepo.find({
      where: { email: Like('%@agents.local') },
      select: ['email', 'handle', 'displayName', 'bio'],
      order: { createdAt: 'ASC' },
    });
    return users.map((u) => ({
      email: u.email ?? '',
      handle: u.handle,
      displayName: u.displayName ?? u.handle,
      bio: u.bio ?? '',
    }));
  }

  /**
   * Issue a JWT for an existing user by email (for agent resume). No magic link needed.
   */
  async getTokenForEmail(email: string): Promise<SeedAgentResult> {
    const normalized = email?.trim();
    if (!normalized) throw new BadRequestException('email is required');
    const user = await this.userRepo.findOne({
      where: { email: normalized },
    });
    if (!user) {
      throw new NotFoundException(`No user with email ${normalized}`);
    }
    const tokens = await this.authService.generateTokens(user);
    return {
      accessToken: tokens.accessToken,
      user: {
        id: user.id,
        handle: user.handle,
        displayName: user.displayName,
        email: user.email,
      },
    };
  }
}
