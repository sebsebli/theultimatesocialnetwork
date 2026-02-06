import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { PostsService } from '../posts/posts.service';
import { UsersService } from '../users/users.service';
import { RepliesService } from '../replies/replies.service';
import { CreatePostDto } from '../posts/dto/create-post.dto';
import { InteractionsService } from '../interactions/interactions.service';
import { FollowsService } from '../follows/follows.service';

@Injectable()
export class AgentApiService {
  constructor(
    private authService: AuthService,
    private postsService: PostsService,
    private usersService: UsersService,
    private repliesService: RepliesService,
    private interactionsService: InteractionsService,
    private followsService: FollowsService,
  ) {}

  async getAgentToken(email: string) {
    // Validate or create user, skipping beta checks
    const user = await this.authService.validateOrCreateUser(
      email,
      undefined,
      true,
    );
    // Generate token
    const tokens = await this.authService.generateTokens(user);
    return tokens;
  }

  async createPost(userId: string, dto: CreatePostDto) {
    // Create post skipping queue checks is possible via service,
    // but we want to skip SAFETY check which is inside create().
    // We need to update PostsService to allow skipping safety check.
    return this.postsService.create(userId, dto, false, true); // skipQueue=false, skipSafety=true
  }

  async createReply(userId: string, postId: string, body: string) {
    // Need skipSafety in replies too
    return this.repliesService.create(userId, postId, body, undefined, true); // parentReplyId=undefined, skipSafety=true
  }
}
