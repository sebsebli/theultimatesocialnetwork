import { Repository } from 'typeorm';
import { Invite } from '../entities/invite.entity';
import { User } from '../entities/user.entity';
import { WaitingList } from '../entities/waiting-list.entity';
import { SystemSetting } from '../entities/system-setting.entity';
export declare class InvitesService {
    private inviteRepo;
    private userRepo;
    private waitingListRepo;
    private settingsRepo;
    constructor(inviteRepo: Repository<Invite>, userRepo: Repository<User>, waitingListRepo: Repository<WaitingList>, settingsRepo: Repository<SystemSetting>);
    isBetaMode(): Promise<boolean>;
    setBetaMode(enabled: boolean): Promise<void>;
    generateCode(userId?: string): Promise<string>;
    validateCode(code: string): Promise<Invite>;
    consumeCode(code: string, userId: string): Promise<void>;
    getMyInvites(userId: string): Promise<{
        codes: Invite[];
        remaining: number;
    }>;
    addToWaitingList(email: string, ipHash?: string): Promise<void>;
}
