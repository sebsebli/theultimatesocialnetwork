import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
export declare class PostsController {
    private readonly postsService;
    constructor(postsService: PostsService);
    create(user: {
        id: string;
    }, dto: CreatePostDto): unknown;
    findOne(id: string, user?: {
        id: string;
    }): unknown;
    getSources(id: string): unknown;
    getReferencedBy(id: string): unknown;
    delete(user: {
        id: string;
    }, id: string): unknown;
    quote(user: {
        id: string;
    }, quotedPostId: string, dto: {
        body: string;
    }): unknown;
}
