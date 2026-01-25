import { ExploreService } from './explore.service';
import { RecommendationService } from './recommendation.service';
export declare class ExploreController {
    private readonly exploreService;
    private readonly recommendationService;
    constructor(exploreService: ExploreService, recommendationService: RecommendationService);
    getTopics(lang?: string, sort?: string): unknown;
    getPeople(user?: {
        id: string;
    }, lang?: string, sort?: string): unknown;
    getQuotedNow(user?: {
        id: string;
    }, lang?: string, sort?: string): unknown;
    getDeepDives(user?: {
        id: string;
    }, lang?: string, sort?: string): unknown;
    getNewsroom(user?: {
        id: string;
    }, lang?: string, sort?: string): unknown;
    getForYou(user: {
        id: string;
    }, limit?: string): unknown;
    getRecommendedPeople(user: {
        id: string;
    }, limit?: string): unknown;
}
