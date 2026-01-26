import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
export declare class RssService {
    private usersRepository;
    private postsRepository;
    constructor(usersRepository: Repository<User>, postsRepository: Repository<Post>);
    generateRss(handle: string): Promise<string>;
}
