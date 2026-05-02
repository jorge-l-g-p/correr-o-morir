/**
 * Interfaces para el estado global de la partida.
 * Usado por GameStateService para emitir cambios vía RxJS.
 */
import { IPlayerState } from './player.interface';
import { ICollectible, IEnvironmentZone } from './collectible.interface';

export type GamePhase =
  | 'idle'         // sin partida activa
  | 'matchmaking'  // buscando oponente
  | 'countdown'    // cuenta regresiva antes de empezar
  | 'playing'      // partida en curso
  | 'finished';    // partida terminada

export interface IGameState {
  phase:       GamePhase;
  roomId:      string | null;
  localPlayer: IPlayerState | null;
  opponent:    IPlayerState | null;
  countdown:   number;             // segundos restantes en cuenta regresiva
  gameDuration: number;            // segundos transcurridos
  collectibles: ICollectible[];
  zones:        IEnvironmentZone[];
  winner:       string | null;     // socketId del ganador, null si empate
}

/** Payload que llega del servidor al terminar la partida */
export interface IGameResult {
  players: Array<{
    socketId:      string;
    username:      string;
    score:         number;
    finalVitality: number;
    winner:        boolean;
  }>;
}
