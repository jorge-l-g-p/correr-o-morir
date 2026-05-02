/**
 * Wrapper sobre Socket.IO.
 * Los Observables de eventos son lazy — solo se suscriben al socket
 * cuando alguien los observa Y el socket ya está conectado.
 * connect() debe llamarse antes de suscribirse a cualquier evento.
 */
import { Injectable, OnDestroy } from '@angular/core';
import { Observable }             from 'rxjs';
import { io, Socket }             from 'socket.io-client';
import { environment }            from '../../../environments/environment';
import { IPlayerState }           from '../interfaces/player.interface';
import { IGameResult }            from '../interfaces/game-state.interface';

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {

  private socket!: Socket;

  /** Abre la conexión al servidor. Debe llamarse antes de suscribirse a eventos. */
  connect(): void {
    if (this.socket?.connected) return;
    this.socket = io(environment.apiUrl, { transports: ['websocket'] });
  }

  disconnect(): void {
    this.socket?.disconnect();
  }

  // ─── Emitters ─────────────────────────────────────────────────────────────

  joinGame(username: string, characterId: string): void {
    this.socket.emit('game:join', { username, characterId });
  }

  sendReady(roomId: string): void {
    this.socket.emit('game:ready', { roomId });
  }

  sendPlayerUpdate(
    roomId:   string,
    position: { x: number; y: number },
    vitality: number,
    score:    number
  ): void {
    this.socket.emit('game:player_update', { roomId, position, vitality, score });
  }

  sendGameEnd(roomId: string, duration: number, players: Partial<IPlayerState>[]): void {
    this.socket.emit('game:end', { roomId, duration, players });
  }

  // ─── Listeners ────────────────────────────────────────────────────────────

  /**
   * Crea un Observable lazy para un evento del socket.
   * La suscripción al socket ocurre solo cuando alguien se subscribe al Observable,
   * garantizando que this.socket ya existe en ese momento.
   */
  private fromSocketEvent<T>(event: string): Observable<T> {
    return new Observable<T>(subscriber => {
      const handler = (data: T) => subscriber.next(data);
      this.socket.on(event, handler);
      return () => this.socket.off(event, handler);
    });
  }

  onJoined(): Observable<{ roomId: string; socketId: string; existingPlayers: IPlayerState[] }> {
    return this.fromSocketEvent('game:joined');
  }

  onPlayerJoined(): Observable<{ socketId: string; username: string; characterId: string }> {
    return this.fromSocketEvent('game:player_joined');
  }

  onStartCountdown(): Observable<{ countdown: number }> {
    return this.fromSocketEvent('game:start_countdown');
  }

  onGameStart(): Observable<void> {
    return this.fromSocketEvent('game:start');
  }

  onOpponentUpdate(): Observable<IPlayerState & { socketId: string }> {
    return this.fromSocketEvent('game:opponent_update');
  }

  onGameResults(): Observable<IGameResult> {
    return this.fromSocketEvent('game:results');
  }

  onOpponentDisconnected(): Observable<void> {
    return this.fromSocketEvent('game:opponent_disconnected');
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
