/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable, Logger } from '@nestjs/common';

const origins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((url) => url.trim())
  : '*';

@WebSocketGateway({
  cors: {
    origin: origins,
    credentials: true,
  },
})
@Injectable()
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private userSockets = new Map<string, string[]>(); // userId -> socketIds

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const auth = client.handshake.auth;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const headers = client.handshake.headers;

      const token =
        (auth as { token?: string })?.token?.split(' ')[1] ||
        (headers as { authorization?: string })?.authorization?.split(' ')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = this.jwtService.verify(token);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const userId = payload.sub as string; // Assuming 'sub' is userId

      client.data.userId = userId;

      const sockets = this.userSockets.get(userId) || [];
      sockets.push(client.id);
      this.userSockets.set(userId, sockets);

      await client.join(`user:${userId}`); // Join a room specific to this user

      this.logger.log(`User connected: ${userId} (Socket: ${client.id})`);
    } catch {
      this.logger.error('Connection unauthorized');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const data = client.data as { userId?: string };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = (data as any)?.userId;
    if (userId) {
      const sockets = this.userSockets.get(userId) || [];
      const updatedSockets = sockets.filter((id) => id !== client.id);
      if (updatedSockets.length > 0) {
        this.userSockets.set(userId, updatedSockets);
      } else {
        this.userSockets.delete(userId);
      }
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
