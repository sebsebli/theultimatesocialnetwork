import { InvitesService } from './invites.service';
export declare class InvitesController {
    private readonly invitesService;
    constructor(invitesService: InvitesService);
    generate(user: {
        id: string;
    }): Promise<{
        code: string;
    }>;
    getMy(user: {
        id: string;
    }): Promise<{
        codes: import("../entities/invite.entity").Invite[];
        remaining: number;
    }>;
}
export declare class AdminInvitesController {
    private readonly invitesService;
    constructor(invitesService: InvitesService);
    generateSystemInvite(): Promise<{
        code: string;
    }>;
    toggleBeta(body: {
        enabled: boolean;
    }): Promise<{
        success: boolean;
    }>;
}
