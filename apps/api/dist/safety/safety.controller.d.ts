import { SafetyService } from './safety.service';
export declare class SafetyController {
    private readonly safetyService;
    constructor(safetyService: SafetyService);
    block(user: {
        id: string;
    }, blockedId: string): unknown;
    unblock(user: {
        id: string;
    }, blockedId: string): unknown;
    mute(user: {
        id: string;
    }, mutedId: string): unknown;
    unmute(user: {
        id: string;
    }, mutedId: string): unknown;
    report(user: {
        id: string;
    }, dto: {
        targetId: string;
        targetType: string;
        reason: string;
    }): unknown;
    getBlocked(user: {
        id: string;
    }): unknown;
    getMuted(user: {
        id: string;
    }): unknown;
}
