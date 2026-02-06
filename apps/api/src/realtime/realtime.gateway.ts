/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { wsConnectionsActive, wsConnectionsTotal } from '../common/metrics';

const origins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((url) => url.trim())
  : process.env.NODE_ENV === 'production'
    ? []
    : '*';

/** Maximum sockets per user to prevent memory issues from reconnect storms. */
const MAX_SOCKETS_PER_USER = 10;
/** Periodic cleanup interval (5 minutes). */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
/** Max incoming message size (64 KB). */
const MAX_HTTP_BUFFER_SIZE = 64 * 1024;
/** Connection idle timeout (5 minutes). */
const PING_TIMEOUT_MS = 5 * 60 * 1000;

@WebSocketGateway({
  cors: {
    origin: origins,
    credentials: true,
  },
  maxHttpBufferSize: MAX_HTTP_BUFFER_SIZE,
  pingTimeout: PING_TIMEOUT_MS,
  pingInterval: 25000, // 25s ping interval
})
@Injectable()
export class RealtimeGateway
  implements
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    OnModuleDestroy
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private userSockets = new Map<string, Set<string>>(); // userId -> Set<socketId>
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(private jwtService: JwtService) {}

  afterInit() {
    // Periodic cleanup of stale entries
    this.cleanupTimer = setInterval(
      () => this.cleanupStaleEntries(),
      CLEANUP_INTERVAL_MS,
    );
  }

  onModuleDestroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.userSockets.clear();
  }

  /** Remove userSocket entries that reference sockets no longer connected. */
  private cleanupStaleEntries() {
    const connectedIds = this.server?.sockets
      ? new Set(Array.from(this.server.sockets.sockets.keys()))
      : new Set<string>();

    let cleaned = 0;
    for (const [userId, socketIds] of this.userSockets.entries()) {
      for (const sid of socketIds) {
        if (!connectedIds.has(sid)) {
          socketIds.delete(sid);
          cleaned++;
        }
      }
      if (socketIds.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    if (cleaned > 0) {
      this.logger.debug(`Cleaned ${cleaned} stale socket entries`);
    }
  }

  async handleConnection(client: Socket) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const auth = client.handshake.auth;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const headers = client.handshake.headers;

      // Extract token from auth object or authorization header
      const rawToken =
        (auth as { token?: string })?.token ||
        (headers as { authorization?: string })?.authorization ||
        '';
      const token = rawToken.startsWith('Bearer ')
        ? rawToken.slice(7)
        : rawToken.split(' ')[1];

      if (!token) {
        wsConnectionsTotal.inc({ status: 'rejected' });
        client.disconnect();
        return;
      }

      let payload: { sub: string };
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        payload = this.jwtService.verify(token);
      } catch (err) {
        this.logger.warn(
          `WS auth failed: ${err instanceof Error ? err.message : 'unknown'}`,
        );
        wsConnectionsTotal.inc({ status: 'rejected' });
        client.disconnect();
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const userId = payload.sub;

      client.data.userId = userId;

      let sockets = this.userSockets.get(userId);
      if (!sockets) {
        sockets = new Set<string>();
        this.userSockets.set(userId, sockets);
      }

      // Cap sockets per user to prevent memory issues
      if (sockets.size >= MAX_SOCKETS_PER_USER) {
        // Disconnect oldest socket (first in set)
        const oldest = sockets.values().next().value;
        if (oldest) {
          const oldSocket = this.server?.sockets?.sockets?.get(oldest);
          if (oldSocket) {
            oldSocket.disconnect(true);
          }
          sockets.delete(oldest);
        }
      }

      sockets.add(client.id);
      wsConnectionsActive.inc();
      wsConnectionsTotal.inc({ status: 'connected' });

      await client.join(`user:${userId}`);

      this.logger.log(`User connected: ${userId} (Socket: ${client.id})`);
    } catch (err) {
      this.logger.error(
        `WS connection error: ${err instanceof Error ? err.message : 'unknown'}`,
      );
      wsConnectionsTotal.inc({ status: 'rejected' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const data = client.data as { userId?: string };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = (data as any)?.userId as string | undefined;
    if (userId) {
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
        }
      }
      wsConnectionsActive.dec();
      wsConnectionsTotal.inc({ status: 'disconnected' });
      this.logger.log(`User disconnected: ${userId}`);
    }
  }

  // Method to send notification to a specific user
  sendNotification(userId: string, notification: Record<string, unknown>) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }

  // Method to send new message to a specific user
  sendMessage(userId: string, message: Record<string, unknown>) {
    this.server.to(`user:${userId}`).emit('message', message);
  }
}
