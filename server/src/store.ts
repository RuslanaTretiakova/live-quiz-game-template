import type { WebSocket } from 'ws';
import type { User, Game } from './types';


export const users = new Map<string, User>(); 
export const usersByName = new Map<string, User>();
export const wsByIndex = new Map<string, WebSocket>();
export const indexByWs = new Map<WebSocket, string>();

export const games = new Map<string, Game>();
export const codeToGameId = new Map<string, string>();

let _userCounter = 1;
export function nextUserIndex(): string {
  return String(_userCounter++);
}