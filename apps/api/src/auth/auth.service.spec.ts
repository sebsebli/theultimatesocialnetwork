import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';
import { Session } from '../entities/session.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InvitesService } from '../invites/invites.service';
import { EmailService } from '../shared/email.service';
import { MeilisearchService } from '../search/meilisearch.service';

describe('AuthService 2FA', () => {
  let service: AuthService;

  const mockUserRepo = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockSessionRepo = {
    save: jest.fn(),
  };

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Session), useValue: mockSessionRepo },
        { provide: JwtService, useValue: { sign: jest.fn(() => 'jwt_token') } },
        { provide: 'REDIS_CLIENT', useValue: mockRedis },
        { provide: InvitesService, useValue: {} },
        { provide: EmailService, useValue: {} },
        { provide: ConfigService, useValue: {} },
        { provide: MeilisearchService, useValue: {} },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should generate a valid 2FA secret', async () => {
    mockUserRepo.findOne.mockResolvedValue({
      id: 'u1',
      email: 'test@cite.com',
    });

    const result = await service.generate2FASecret('u1');
    expect(result).toHaveProperty('secret');
    expect(result).toHaveProperty('otpauthUrl');
    expect(result.otpauthUrl).toContain('Citewalk');
  });
});
