import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface OrderPayload {
  orderId: string;
  tableId?: string;
  items?: unknown[];
  status?: string;
  [key: string]: unknown;
}

interface BillPayload {
  billId: string;
  orderId: string;
  amount: number;
  status?: string;
  [key: string]: unknown;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/',
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket): void {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('order:new')
  handleOrderNew(client: Socket, payload: OrderPayload): void {
    // Broadcast to all clients except sender
    client.broadcast.emit('order:new', payload);
  }

  @SubscribeMessage('order:update')
  handleOrderUpdate(client: Socket, payload: OrderPayload): void {
    // Broadcast to all clients except sender
    client.broadcast.emit('order:update', payload);
  }

  @SubscribeMessage('bill:paid')
  handleBillPaid(client: Socket, payload: BillPayload): void {
    // Broadcast to all clients except sender
    client.broadcast.emit('bill:paid', payload);
  }
}
