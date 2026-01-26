import { InvitesService } from './invites.service';
export declare class WaitingListController {
    private readonly invitesService;
    constructor(invitesService: InvitesService);
    join(body: {
        email: string;
    }, ip: string): Promise<{
        message: string;
    }>;
}
