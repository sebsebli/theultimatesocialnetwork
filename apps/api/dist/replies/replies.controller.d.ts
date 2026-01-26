import { RepliesService } from './replies.service';
export declare class RepliesController {
    private readonly repliesService;
    constructor(repliesService: RepliesService);
    create(user: {
        id: string;
    }, postId: string, dto: {
        body: string;
        parentReplyId?: string;
    }): Promise<import("../entities/reply.entity").Reply>;
    findAll(postId: string): Promise<import("../entities/reply.entity").Reply[]>;
    delete(user: {
        id: string;
    }, replyId: string): Promise<{
        success: boolean;
    }>;
}
