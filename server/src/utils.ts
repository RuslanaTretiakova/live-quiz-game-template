import { WebSocket } from 'ws';
import type { Game } from './types';
import { users } from './store';

export function send(ws: WebSocket, type: string, data: unknown): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, data, id: 0 }));
  }
}

export function broadcast(game: Game, type: string, data: unknown): void {
  const hostUser = users.get(game.hostId);
  if (hostUser?.ws) send(hostUser.ws, type, data);
  for (const player of game.players) {
    if (player.ws) send(player.ws, type, data);
  }
}

export function generateGameId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function getPlayerListData(game: Game) {
  return game.players.map(p => ({
    name: p.name,
    index: p.index,
    score: p.score,
  }));
}