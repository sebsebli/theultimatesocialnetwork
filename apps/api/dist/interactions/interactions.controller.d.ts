import { InteractionsService } from './interactions.service';
export declare class InteractionsController {
    private readonly interactionsService;
    constructor(interactionsService: InteractionsService);
    view(postId: string): unknown;
    recordTime(user: {
        id: string;
    }, postId: string, body: {
        duration: number;
    }): unknown;
    like(user: {
        id: string;
    }, postId: string): unknown;
    keep(user: {
        id: string;
    }, postId: string): unknown;
}
