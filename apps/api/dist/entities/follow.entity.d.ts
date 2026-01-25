import { User } from './user.entity';
export declare class Follow {
    followerId: string;
    followeeId: string;
    createdAt: Date;
    follower: User;
    followee: User;
}
