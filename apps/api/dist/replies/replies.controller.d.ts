import { RepliesService } from './replies.service';
export declare class RepliesController {
    private readonly repliesService;
    constructor(repliesService: RepliesService);
    create(user: {
        id: string;
    }, postId: string, dto: {
        body: string;
        parentReplyId?: string;
    }): unknown;
    findAll(postId: string): unknown;
    delete(user: {
        id: string;
    }, replyId: string): unknown;
}
