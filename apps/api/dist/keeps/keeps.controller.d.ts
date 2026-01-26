import { KeepsService } from './keeps.service';
export declare class KeepsController {
    private readonly keepsService;
    constructor(keepsService: KeepsService);
    getAll(user: {
        id: string;
    }, search?: string, inCollection?: string): Promise<import("../entities/keep.entity").Keep[]>;
}
