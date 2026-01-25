import { OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PushOutbox } from '../entities/push-outbox.entity';
import { PushToken } from '../entities/push-token.entity';
import { ApnsSender } from './senders/apns.sender';
import { FcmSender } from './senders/fcm.sender';
export declare class PushWorker implements OnApplicationBootstrap, OnApplicationShutdown {
    private outboxRepo;
    private tokenRepo;
    private apnsSender;
    private fcmSender;
    private readonly logger;
    private isRunning;
    private intervalId;
    constructor(outboxRepo: Repository<PushOutbox>, tokenRepo: Repository<PushToken>, apnsSender: ApnsSender, fcmSender: FcmSender);
    onApplicationBootstrap(): void;
    onApplicationShutdown(): void;
    start(): void;
    stop(): void;
    processOutbox(): any;
    private processItem;
    private sendToToken;
}
