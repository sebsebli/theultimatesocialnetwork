import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Session } from 'neo4j-driver';
export declare class Neo4jService implements OnModuleInit, OnModuleDestroy {
    private configService;
    private driver;
    private isHealthy;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    getStatus(): {
        healthy: boolean;
    };
    getSession(): Session;
    run(query: string, params?: Record<string, any>): Promise<import("neo4j-driver").QueryResult<import("neo4j-driver").RecordShape> | {
        records: never[];
    }>;
}
