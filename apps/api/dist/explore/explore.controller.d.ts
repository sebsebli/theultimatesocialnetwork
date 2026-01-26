import { ExploreService } from './explore.service';
import { RecommendationService } from './recommendation.service';
export declare class ExploreController {
    private readonly exploreService;
    private readonly recommendationService;
    constructor(exploreService: ExploreService, recommendationService: RecommendationService);
    getTopics(lang?: string, sort?: string): Promise<{
        reasons: string[];
        id: string;
        slug: string;
        title: string;
        createdAt: Date;
        createdBy: string;
    }[]>;
    getPeople(user?: {
        id: string;
    }, lang?: string, sort?: string): Promise<import("../entities/user.entity").User[]>;
    getQuotedNow(user?: {
        id: string;
    }, lang?: string, sort?: string): Promise<{
        reasons: string[];
        id: string;
        authorId: string;
        author: import("../entities/user.entity").User;
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
    getDeepDives(user?: {
        id: string;
    }, lang?: string, sort?: string): Promise<{
        reasons: string[];
        id: string;
        authorId: string;
        author: import("../entities/user.entity").User;
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
    getNewsroom(user?: {
        id: string;
    }, lang?: string, sort?: string): Promise<{
        reasons: string[];
        id: string;
        authorId: string;
        author: import("../entities/user.entity").User;
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
    getForYou(user: {
        id: string;
    }, limit?: string): Promise<import("../entities/post.entity").Post[]>;
    getRecommendedPeople(user: {
        id: string;
    }, limit?: string): Promise<import("../entities/user.entity").User[]>;
}
