import { InteractionsService } from './interactions.service';
export declare class InteractionsController {
    private readonly interactionsService;
    constructor(interactionsService: InteractionsService);
    view(postId: string): Promise<{
        ok: boolean;
    }>;
    recordTime(user: {
        id: string;
    }, postId: string, body: {
        duration: number;
    }): Promise<{
        ok: boolean;
    }>;
    like(user: {
        id: string;
    }, postId: string): Promise<{
        liked: boolean;
    }>;
    keep(user: {
        id: string;
    }, postId: string): Promise<{
        kept: boolean;
    }>;
}
