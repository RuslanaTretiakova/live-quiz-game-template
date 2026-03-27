import type { WebSocket } from 'ws';
import type { AnswerData, Game } from '../types.js';
import { games, indexByWs } from '../store.js';
import { send, broadcast, getPlayerListData } from '../utils.js';
import { sendQuestion } from './startGame.js';

const BASE_POINTS = 1000;

export function handleAnswer(ws: WebSocket, data: AnswerData): void {
  const playerIndex = indexByWs.get(ws);
  if (!playerIndex) return;

  const game = games.get(data.gameId);
  if (!game || game.status !== 'in_progress') return;

  const player = game.players.find(p => p.index === playerIndex);
  if (!player || player.hasAnswered) return;

  if (data.questionIndex !== game.currentQuestion) return;

  player.hasAnswered = true;
  game.playerAnswers.set(playerIndex, {
    answerIndex: data.answerIndex,
    timestamp: Date.now(),
  });

  send(ws, 'answer_accepted', { questionIndex: data.questionIndex });

  const allAnswered = game.players.every(p => p.hasAnswered);
  if (allAnswered) {
    if (game.questionTimer) clearTimeout(game.questionTimer);
    resolveQuestion(game);
  }
}

export function resolveQuestion(game: Game): void {
  if (game.status !== 'in_progress') return;

  const q = game.questions[game.currentQuestion];
  const startTime = game.questionStartTime!;
  const timeLimitMs = q.timeLimitSec * 1000;

  const playerResults = game.players.map(player => {
    const answer = game.playerAnswers.get(player.index);
    const answered = !!answer;
    const correct = answered && answer!.answerIndex === q.correctIndex;

    let pointsEarned = 0;
    if (correct) {
      const elapsed = answer!.timestamp - startTime;
      const timeRemaining = Math.max(0, timeLimitMs - elapsed);
      pointsEarned = Math.round(BASE_POINTS * (timeRemaining / timeLimitMs));
    }

    player.score += pointsEarned;
    return { name: player.name, answered, correct, pointsEarned, totalScore: player.score };
  });

  broadcast(game, 'question_result', {
    questionIndex: game.currentQuestion,
    correctIndex: q.correctIndex,
    playerResults,
  });

  const nextIndex = game.currentQuestion + 1;
  if (nextIndex < game.questions.length) {
    game.currentQuestion = nextIndex;
    setTimeout(() => sendQuestion(game), 3000);
  } else {
    setTimeout(() => finishGame(game), 3000);
  }
}

export function finishGame(game: Game): void {
  game.status = 'finished';

  const sorted = [...game.players].sort((a, b) => b.score - a.score);
  const scoreboard = sorted.map((p, i) => ({
    name: p.name,
    score: p.score,
    rank: i + 1,
  }));

  broadcast(game, 'game_finished', { scoreboard });

  const { codeToGameId, games } = require('../store');
  codeToGameId.delete(game.code);
  games.delete(game.id);
}

function setTimeout(arg0: () => void, arg1: number) {
    throw new Error('Function not implemented.');
}
function clearTimeout(questionTimer: any) {
    throw new Error('Function not implemented.');
}

