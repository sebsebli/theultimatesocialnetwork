import { Repository } from 'typeorm';
import { Follow } from '../entities/follow.entity';
import { FollowRequest } from '../entities/follow-request.entity';
import { User } from '../entities/user.entity';
import { Neo4jService } from '../database/neo4j.service';
export declare class FollowsService {
    private followRepo;
    private followRequestRepo;
    private userRepo;
    private neo4jService;
    constructor(followRepo: Repository<Follow>, followRequestRepo: Repository<FollowRequest>, userRepo: Repository<User>, neo4jService: Neo4jService);
    follow(followerId: string, followeeId: string): unknown;
    unfollow(followerId: string, followeeId: string): unknown;
    approveFollowRequest(userId: string, requestId: string): unknown;
    rejectFollowRequest(userId: string, requestId: string): unknown;
}
