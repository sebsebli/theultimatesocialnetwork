import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
export declare class PostsController {
    private readonly postsService;
    constructor(postsService: PostsService);
    create(user: {
        id: string;
    }, dto: CreatePostDto): Promise<import("../entities/post.entity").Post>;
    findOne(id: string, user?: {
        id: string;
    }): Promise<import("../entities/post.entity").Post | null>;
    getSources(id: string): Promise<import("../entities/external-source.entity").ExternalSource[]>;
    getReferencedBy(id: string): Promise<import("../entities/post.entity").Post[]>;
    delete(user: {
        id: string;
    }, id: string): Promise<void>;
    quote(user: {
        id: string;
    }, quotedPostId: string, dto: {
        body: string;
    }): Promise<import("../entities/post.entity").Post>;
}
