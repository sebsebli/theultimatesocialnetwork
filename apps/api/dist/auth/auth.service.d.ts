import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import Redis from 'ioredis';
import { InvitesService } from '../invites/invites.service';
export declare class AuthService {
    private userRepo;
    private jwtService;
    private redis;
    private invitesService;
    constructor(userRepo: Repository<User>, jwtService: JwtService, redis: Redis, invitesService: InvitesService);
    sendMagicLink(email: string, inviteCode?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyMagicLink(email: string, token: string): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            handle: string;
            displayName: string;
        };
    }>;
    generateTokens(user: User): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            handle: string;
            displayName: string;
        };
    }>;
}
