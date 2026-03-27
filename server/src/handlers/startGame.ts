import type { WebSocket } from 'ws';
import type { Game, StartGameData } from '../types.js';
import { games, indexByWs } from '../store.js';
import { send, broadcast } from '../utils.js';
import { resolveQuestion } from './answer.js';

export function handleStartGame(ws: WebSocket, data: StartGameData): void {
  const hostIndex = indexByWs.get(ws);
  const game = games.get(data.gameId);

  if (!game) { send(ws, 'error', { message: 'Game not found' }); return; }
  if (game.hostId !== hostIndex) {
    send(ws, 'error', { message: 'Only the host can start the game' });
    return;
  }
  if (game.status !== 'waiting') {
    send(ws, 'error', { message: 'Game already started' });
    return;
  }

  game.status = 'in_progress';
  game.currentQuestion = 0;
  sendQuestion(game);
}

export function sendQuestion(game: Game): void {
  if (!game) return;

  const q = game.questions[game.currentQuestion];

  for (const p of game.players) {
    p.hasAnswered = false;
    p.answerTime = undefined;
    p.answeredCorrectly = undefined;
  }
  game.playerAnswers.clear();
  game.questionStartTime = Date.now();

  broadcast(game, 'question', {
    questionNumber: game.currentQuestion + 1,
    totalQuestions: game.questions.length,
    text: q.text,
    options: q.options,
    timeLimitSec: q.timeLimitSec,
  });

  game.questionTimer = setTimeout(() => resolveQuestion(game), q.timeLimitSec * 1000);
}

