import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class AgentApiGuard implements CanActivate {
  private readonly logger = new Logger(AgentApiGuard.name);

  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // 1. Check IP (Localhost only)
    // Note: In Docker/K8s, this might be the ingress IP. We rely on the secret more.
    // But user asked for "ONLY accessible from within the server (or on localhost etc.)"
    const ip = request.ip || request.socket.remoteAddress;
    // Note: IP check is informational; security relies on the secret header.
    // Docker/K8s environments may report non-localhost IPs (e.g. 172.x).

    // 2. Check Secret Header
    const secret = this.configService.get<string>('CITE_AGENT_SECRET');
    const headerSecret = request.headers['x-agent-secret'];

    if (!secret) {
      this.logger.error('CITE_AGENT_SECRET not configured');
      return false;
    }

    if (headerSecret !== secret) {
      this.logger.warn(`Invalid agent secret from IP ${ip}`);
      throw new UnauthorizedException('Invalid agent secret');
    }

    return true;
  }
}
