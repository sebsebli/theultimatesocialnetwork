import { Repository, DataSource } from 'typeorm';
import { Topic } from '../entities/topic.entity';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { PostEdge } from '../entities/post-edge.entity';
import { Follow } from '../entities/follow.entity';
import { ExternalSource } from '../entities/external-source.entity';
import { Neo4jService } from '../database/neo4j.service';
export declare class ExploreService {
    private topicRepo;
    private userRepo;
    private postRepo;
    private postEdgeRepo;
    private followRepo;
    private externalSourceRepo;
    private dataSource;
    private neo4jService;
    constructor(topicRepo: Repository<Topic>, userRepo: Repository<User>, postRepo: Repository<Post>, postEdgeRepo: Repository<PostEdge>, followRepo: Repository<Follow>, externalSourceRepo: Repository<ExternalSource>, dataSource: DataSource, neo4jService: Neo4jService);
    getTopics(filter?: {
        lang?: string;
        sort?: string;
    }): unknown;
    getPeople(userId?: string, filter?: {
        lang?: string;
        sort?: string;
    }): unknown;
    getQuotedNow(userId?: string, limit?: number, filter?: {
        lang?: string;
        sort?: string;
    }): unknown;
    getTopicStartHere(topicId: string, limit?: number): unknown;
    getDeepDives(userId?: string, limit?: number, filter?: {
        lang?: string;
        sort?: string;
    }): unknown;
    getNewsroom(userId?: string, limit?: number, filter?: {
        lang?: string;
        sort?: string;
    }): unknown;
}
