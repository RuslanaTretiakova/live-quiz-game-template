import type { WebSocket } from 'ws';
import type { RegData } from '../types';
import { users, usersByName, wsByIndex, indexByWs, nextUserIndex } from '../store';
import { send } from '../utils';

export function handleReg(ws: WebSocket, data: RegData): void {
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

  const index = nextUserIndex();
  const user = { name, password, index, ws };
  users.set(index, user);
  usersByName.set(name, user);
  wsByIndex.set(index, ws);
  indexByWs.set(ws, index);

  send(ws, 'reg', { name, index, error: false, errorText: '' });
}