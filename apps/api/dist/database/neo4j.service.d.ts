import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Session } from 'neo4j-driver';
export declare class Neo4jService implements OnModuleInit, OnModuleDestroy {
    private configService;
    private driver;
    constructor(configService: ConfigService);
    onModuleInit(): any;
    onModuleDestroy(): any;
    getSession(): Session;
    run(query: string, params?: Record<string, any>): unknown;
}
