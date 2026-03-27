import type { WebSocket } from 'ws';
import type { JoinGameData } from '../types.js';
import { users, games, codeToGameId, indexByWs } from '../store.js';
import { send, broadcast, getPlayerListData } from '../utils.js';

export function handleJoinGame(ws: WebSocket, data: JoinGameData): void {
  const playerIndex = indexByWs.get(ws);
  if (!playerIndex) { send(ws, 'error', { message: 'Not registered' }); return; }

  const user = users.get(playerIndex);
  if (!user) { send(ws, 'error', { message: 'User not found' }); return; }

  const gameId = codeToGameId.get(data.code);
  if (!gameId) { send(ws, 'error', { message: 'Game not found' }); return; }

  const game = games.get(gameId);
  if (!game) { send(ws, 'error', { message: 'Game not found' }); return; }

  if (game.status !== 'waiting') {
    send(ws, 'error', { message: 'Game already started' });
    return;
  }

  const existing = game.players.find(p => p.index === playerIndex);
  if (existing) {
    existing.ws = ws;
    send(ws, 'game_joined', { gameId });
    return;
  }

  game.players.push({ name: user.name, index: playerIndex, score: 0, ws });

  send(ws, 'game_joined', { gameId });
  broadcast(game, 'player_joined', {
    playerName: user.name,
    playerCount: game.players.length,
  });
  broadcast(game, 'update_players', getPlayerListData(game));
}