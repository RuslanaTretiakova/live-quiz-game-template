import { WebSocketServer, WebSocket } from 'ws';
import * as dotenv from 'dotenv';
import type { WSMessage } from './types';

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const wss = new WebSocketServer({ port: PORT });

wss.on('listening', () => {
  console.log(`WebSocket server is running on ws://localhost:${PORT}`);
});

wss.on('connection', (ws: WebSocket) => {
  ws.on('message', (raw: Buffer) => {
    let msg: WSMessage;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      ws.send(JSON.stringify({ type: 'error', data: { message: 'Invalid JSON' }, id: 0 }));
      return;
    }

    const { type, data } = msg;

    switch (type) {
      case 'reg':break;
      case 'create_game':  break;
      case 'join_game': break;
      case 'start_game': break;
      case 'answer': break;
      default:
        ws.send(JSON.stringify({ type: 'error', data: { message: `Unknown command: ${type}` }, id: 0 }));
    }
  });

  ws.on('close', () => {});
  ws.on('error', () => {});
});