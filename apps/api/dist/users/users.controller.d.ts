import { UsersService } from './users.service';
import { Queue } from 'bullmq';
export declare class UsersController {
    private readonly usersService;
    private exportQueue;
    constructor(usersService: UsersService, exportQueue: Queue);
    updateMe(user: {
        id: string;
    }, updates: any): unknown;
    getMe(user: {
        id: string;
    }): unknown;
    deleteMe(user: {
        id: string;
    }): unknown;
    exportData(user: {
        id: string;
        email?: string;
    }): unknown;
    getSuggested(): unknown;
    getReplies(id: string): unknown;
    getQuotes(id: string): unknown;
    findOne(handle: string): unknown;
}
