import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { Reply } from '../entities/reply.entity';
import { PostEdge } from '../entities/post-edge.entity';
import { Like } from '../entities/like.entity';
import { ReplyLike } from '../entities/reply-like.entity';
import { Keep } from '../entities/keep.entity';
import { Follow } from '../entities/follow.entity';
import { FollowRequest } from '../entities/follow-request.entity';
import { PostRead } from '../entities/post-read.entity';
import { Notification } from '../entities/notification.entity';
import { Collection } from '../entities/collection.entity';
import { NotificationPref } from '../entities/notification-pref.entity';
import { AccountDeletionRequest } from '../entities/account-deletion-request.entity';
import { EmailChangeRequest } from '../entities/email-change-request.entity';
import { DataExport } from '../entities/data-export.entity';
import { MeilisearchService } from '../search/meilisearch.service';
import { CollectionsService } from '../collections/collections.service';
import { EmailService } from '../shared/email.service';
import { UploadService } from '../upload/upload.service';
import { InteractionsService } from '../interactions/interactions.service';

const mockRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn(),
};

const mockPostRepo = {
  ...mockRepo,
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    setParameter: jest.fn().mockReturnThis(),
  })),
};

const mockReplyRepo = {
  ...mockRepo,
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  })),
};

const mockConfigService = {
  get: jest.fn(),
};

const mockMeilisearchService = {
  indexUser: jest.fn(),
  deleteUser: jest.fn(),
};

const mockCollectionsService = {
  getLatestItemPreviewByPostDate: jest.fn(),
};

const mockEmailService = {
  sendEmailChangeConfirmation: jest.fn(),
  sendAccountDeletionConfirmation: jest.fn(),
};

const mockUploadService = {
  getImageUrl: jest.fn(),
};

const mockInteractionsService = {
  getLikeKeepForViewer: jest
    .fn()
    .mockResolvedValue({ likedIds: new Set(), keptIds: new Set() }),
};

describe('UsersService', () => {
  let service: UsersService;
  let postRepo: Repository<Post>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepo },
        { provide: getRepositoryToken(Post), useValue: mockPostRepo },
        { provide: getRepositoryToken(Reply), useValue: mockReplyRepo },
        { provide: getRepositoryToken(PostEdge), useValue: mockRepo },
        { provide: getRepositoryToken(Like), useValue: mockRepo },
        { provide: getRepositoryToken(ReplyLike), useValue: mockRepo },
        { provide: getRepositoryToken(Keep), useValue: mockRepo },
        { provide: getRepositoryToken(Follow), useValue: mockRepo },
        { provide: getRepositoryToken(FollowRequest), useValue: mockRepo },
        { provide: getRepositoryToken(PostRead), useValue: mockRepo },
        { provide: getRepositoryToken(Notification), useValue: mockRepo },
        { provide: getRepositoryToken(Collection), useValue: mockRepo },
        { provide: getRepositoryToken(NotificationPref), useValue: mockRepo },
        {
          provide: getRepositoryToken(AccountDeletionRequest),
          useValue: mockRepo,
        },
        { provide: getRepositoryToken(EmailChangeRequest), useValue: mockRepo },
        { provide: getRepositoryToken(DataExport), useValue: mockRepo },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MeilisearchService, useValue: mockMeilisearchService },
        { provide: CollectionsService, useValue: mockCollectionsService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: UploadService, useValue: mockUploadService },
        { provide: InteractionsService, useValue: mockInteractionsService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    postRepo = module.get<Repository<Post>>(getRepositoryToken(Post));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserPosts (cursor pagination)', () => {
    it('should use cursor when provided for posts', async () => {
      const cursor = new Date().toISOString();
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      jest
        .spyOn(postRepo, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as unknown as any);

      await service.getUserPosts(
        'user-id',
        1,
        10,
        'posts',
        'viewer-id',
        cursor,
      );

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'post.created_at < :cursor',
        {
          cursor: new Date(cursor),
        },
      );
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
    });

    it('should use offset when cursor is NOT provided for posts', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      jest
        .spyOn(postRepo, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as unknown as any);

      await service.getUserPosts(
        'user-id',
        2,
        10,
        'posts',
        'viewer-id',
        undefined,
      );

      // skip = (page - 1) * limit = (2 - 1) * 10 = 10
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);
      // Should NOT have called with cursor
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        expect.stringContaining('post.created_at < :cursor'),
        expect.anything(),
      );
    });
  });
});
