import { PostVisibility } from '../../entities/post.entity';
export declare class CreatePostDto {
    body: string;
    visibility?: PostVisibility;
    headerImageKey?: string;
}
