import type { WebSocket } from 'ws';
import type { CreateGameData } from '../types.js';
import { games, codeToGameId, indexByWs } from '../store.js';
import { send, generateGameId, generateRoomCode } from '../utils.js';


export function handleCreateGame(ws: WebSocket, data: CreateGameData): void {
  const hostIndex = indexByWs.get(ws);
  if (!hostIndex) {
    send(ws, 'error', { message: 'Not registered' });
    return;
  }

  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    send(ws, 'error', { message: 'Questions are required' });
    return;
  }

  const gameId = generateGameId();
  let code = generateRoomCode();
  while (codeToGameId.has(code)) code = generateRoomCode();

  games.set(gameId, {
    id: gameId,
    code,
    hostId: hostIndex,
    questions: data.questions,
    players: [],
    currentQuestion: -1,
    status: 'waiting',
    playerAnswers: new Map(),
  });

  codeToGameId.set(code, gameId);

  send(ws, 'game_created', { gameId, code });
}