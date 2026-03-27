import type { WebSocket } from 'ws';
import { users, games, codeToGameId, wsByIndex, indexByWs } from './store.js';
import { broadcast, getPlayerListData } from './utils.js';

export function handleDisconnect(ws: WebSocket): void {
  const playerIndex = indexByWs.get(ws);
  if (!playerIndex) return;

  indexByWs.delete(ws);
  wsByIndex.delete(playerIndex);
  const user = users.get(playerIndex);
  if (user) user.ws = undefined;

  for (const [gameId, game] of games.entries()) {
    if (game.hostId === playerIndex) {
      if (game.questionTimer) clearTimeout(game.questionTimer);
      for (const p of game.players) {
        if (p.ws) p.ws.close();
      }
      codeToGameId.delete(game.code);
      games.delete(gameId);
      continue;
    }

    const before = game.players.length;
    game.players = game.players.filter(p => p.index !== playerIndex);
    if (game.players.length !== before) {
      broadcast(game, 'update_players', getPlayerListData(game));
    }
  }
}