import { User } from './user.entity';
export declare class Mute {
    muterId: string;
    mutedId: string;
    muter: User;
    muted: User;
    createdAt: Date;
}
