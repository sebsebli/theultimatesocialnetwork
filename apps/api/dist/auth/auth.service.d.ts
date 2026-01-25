import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import Redis from 'ioredis';
import { InvitesService } from '../invites/invites.service';
import { EmailService } from '../shared/email.service';
import { ConfigService } from '@nestjs/config';
export declare class AuthService {
    private userRepo;
    private jwtService;
    private redis;
    private invitesService;
    private emailService;
    private configService;
    constructor(userRepo: Repository<User>, jwtService: JwtService, redis: Redis, invitesService: InvitesService, emailService: EmailService, configService: ConfigService);
    login(email: string, inviteCode?: string): unknown;
    verifyToken(email: string, token: string): unknown;
    validateOrCreateUser(email: string, inviteCode?: string): Promise<User>;
    generateTokens(user: User): unknown;
}
