import { SafetyService } from './safety.service';
export declare class SafetyController {
    private readonly safetyService;
    constructor(safetyService: SafetyService);
    block(user: {
        id: string;
    }, blockedId: string): Promise<import("../entities/block.entity").Block>;
    unblock(user: {
        id: string;
    }, blockedId: string): Promise<{
        success: boolean;
    }>;
    mute(user: {
        id: string;
    }, mutedId: string): Promise<import("../entities/mute.entity").Mute>;
    unmute(user: {
        id: string;
    }, mutedId: string): Promise<{
        success: boolean;
    }>;
    report(user: {
        id: string;
    }, dto: {
        targetId: string;
        targetType: string;
        reason: string;
    }): Promise<import("../entities/report.entity").Report>;
    getBlocked(user: {
        id: string;
    }): Promise<import("../entities/block.entity").Block[]>;
    getMuted(user: {
        id: string;
    }): Promise<import("../entities/mute.entity").Mute[]>;
}
