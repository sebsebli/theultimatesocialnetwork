import { InvitesService } from './invites.service';
export declare class InvitesController {
    private readonly invitesService;
    constructor(invitesService: InvitesService);
    generate(user: {
        id: string;
    }): unknown;
    getMy(user: {
        id: string;
    }): unknown;
}
export declare class AdminInvitesController {
    private readonly invitesService;
    constructor(invitesService: InvitesService);
    generateSystemInvite(): unknown;
    toggleBeta(body: {
        enabled: boolean;
    }): unknown;
}
