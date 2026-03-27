import { WebSocketServer, WebSocket } from 'ws';
import * as dotenv from 'dotenv';
import type {
  User, Game, WSMessage,
  RegData, CreateGameData, JoinGameData, StartGameData, AnswerData
} from './types';

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const users = new Map<string, User>();
const usersByName = new Map<string, User>();
const wsByIndex = new Map<string, WebSocket>();
const indexByWs = new Map<WebSocket, string>();
const games = new Map<string, Game>();
const codeToGameId = new Map<string, string>();

let userCounter = 1;

function send(ws: WebSocket, type: string, data: unknown): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, data, id: 0 }));
  }
}

function broadcast(game: Game, type: string, data: unknown): void {
  const hostUser = users.get(game.hostId);
  if (hostUser?.ws) send(hostUser.ws, type, data);
  for (const player of game.players) {
    if (player.ws) send(player.ws, type, data);
  }
}

function generateGameId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function getPlayerListData(game: Game) {
  return game.players.map(p => ({
    name: p.name,
    index: p.index,
    score: p.score,
  }));
}

function handleReg(ws: WebSocket, data: RegData): void {
  const { name, password } = data;

  if (!name || !password) {
    send(ws, 'reg', { error: true, errorText: 'Name and password are required' });
    return;
  }

  const existing = usersByName.get(name);

  if (existing) {
    if (existing.password !== password) {
      send(ws, 'reg', { error: true, errorText: 'Wrong password' });
      return;
    }
    existing.ws = ws;
    wsByIndex.set(existing.index, ws);
    indexByWs.set(ws, existing.index);

    send(ws, 'reg', {
      name: existing.name,
      index: existing.index,
      error: false,
      errorText: '',
    });
    return;
  }

  const index = String(userCounter++);
  const user: User = { name, password, index, ws };
  users.set(index, user);
  usersByName.set(name, user);
  wsByIndex.set(index, ws);
  indexByWs.set(ws, index);

  send(ws, 'reg', {
    name,
    index,
    error: false,
    errorText: '',
  });
}