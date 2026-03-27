import { WebSocketServer, WebSocket } from 'ws';
import * as dotenv from 'dotenv';
import type { WSMessage, RegData, CreateGameData, JoinGameData, StartGameData, AnswerData } from './types';

import { handleReg } from './handlers/reg.js';
import { handleCreateGame } from './handlers/createGame.js';
import { handleJoinGame }   from './handlers/joinGame.js';
import { handleStartGame }  from './handlers/startGame.js';
import { handleAnswer }     from './handlers/answer.js';
import { handleDisconnect } from './disconnect.js';

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
      case 'reg':          handleReg(ws, data as RegData);               break;
      case 'create_game':  handleCreateGame(ws, data as CreateGameData); break;
      case 'join_game':    handleJoinGame(ws, data as JoinGameData);     break;
      case 'start_game':   handleStartGame(ws, data as StartGameData);   break;
      case 'answer':       handleAnswer(ws, data as AnswerData);         break;
      default:
        ws.send(JSON.stringify({ type: 'error', data: { message: `Unknown command: ${type}` }, id: 0 }));
    }
  });

  ws.on('close', () => handleDisconnect(ws));
  ws.on('error', () => handleDisconnect(ws));
});