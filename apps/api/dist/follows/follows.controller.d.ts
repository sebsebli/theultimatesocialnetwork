import { FollowsService } from './follows.service';
export declare class FollowsController {
    private readonly followsService;
    constructor(followsService: FollowsService);
    follow(user: {
        id: string;
    }, followeeId: string): Promise<import("../entities/follow.entity").Follow | import("../entities/follow-request.entity").FollowRequest>;
    unfollow(user: {
        id: string;
    }, followeeId: string): Promise<{
        success: boolean;
    }>;
}
