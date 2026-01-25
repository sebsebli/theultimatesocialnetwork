import { OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { UsersService } from './users.service';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
export declare class ExportWorker implements OnApplicationBootstrap, OnApplicationShutdown {
    private usersService;
    private configService;
    private redis;
    private readonly logger;
    private worker;
    constructor(usersService: UsersService, configService: ConfigService, redis: Redis);
    onApplicationBootstrap(): void;
    onApplicationShutdown(): void;
    processExport(userId: string, userEmail: string): Promise<void>;
    sendEmail(to: string, attachment: Buffer): Promise<void>;
}
