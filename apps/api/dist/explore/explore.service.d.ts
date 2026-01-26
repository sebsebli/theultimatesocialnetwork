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
    }): Promise<{
        reasons: string[];
        id: string;
        slug: string;
        title: string;
        createdAt: Date;
        createdBy: string;
    }[]>;
    getPeople(userId?: string, filter?: {
        lang?: string;
        sort?: string;
    }): Promise<{
        reasons: string[];
        id: string;
        email: string;
        handle: string;
        displayName: string;
        bio: string;
        isProtected: boolean;
        invitesRemaining: number;
        languages: string[];
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date;
        followerCount: number;
        followingCount: number;
        quoteReceivedCount: number;
    }[]>;
    getQuotedNow(userId?: string, limit?: number, filter?: {
        lang?: string;
        sort?: string;
    }): Promise<{
        reasons: string[];
        id: string;
        authorId: string;
        author: User;
        visibility: import("../entities/post.entity").PostVisibility;
        body: string;
        title: string | null;
        headerImageKey: string | null;
        headerImageBlurhash: string | null;
        lang: string | null;
        langConfidence: number | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date;
        replyCount: number;
        quoteCount: number;
        privateLikeCount: number;
        viewCount: number;
        readingTimeMinutes: number;
    }[]>;
    getTopicStartHere(topicId: string, limit?: number): Promise<Post[]>;
    getDeepDives(userId?: string, limit?: number, filter?: {
        lang?: string;
        sort?: string;
    }): Promise<{
        reasons: string[];
        id: string;
        authorId: string;
        author: User;
        visibility: import("../entities/post.entity").PostVisibility;
        body: string;
        title: string | null;
        headerImageKey: string | null;
        headerImageBlurhash: string | null;
        lang: string | null;
        langConfidence: number | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date;
        replyCount: number;
        quoteCount: number;
        privateLikeCount: number;
        viewCount: number;
        readingTimeMinutes: number;
    }[]>;
    getNewsroom(userId?: string, limit?: number, filter?: {
        lang?: string;
        sort?: string;
    }): Promise<{
        reasons: string[];
        id: string;
        authorId: string;
        author: User;
        visibility: import("../entities/post.entity").PostVisibility;
        body: string;
        title: string | null;
        headerImageKey: string | null;
        headerImageBlurhash: string | null;
        lang: string | null;
        langConfidence: number | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date;
        replyCount: number;
        quoteCount: number;
        privateLikeCount: number;
        viewCount: number;
        readingTimeMinutes: number;
    }[]>;
}
