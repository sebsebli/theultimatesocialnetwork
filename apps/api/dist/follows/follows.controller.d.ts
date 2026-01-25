import { FollowsService } from './follows.service';
export declare class FollowsController {
    private readonly followsService;
    constructor(followsService: FollowsService);
    follow(user: {
        id: string;
    }, followeeId: string): unknown;
    unfollow(user: {
        id: string;
    }, followeeId: string): unknown;
}
