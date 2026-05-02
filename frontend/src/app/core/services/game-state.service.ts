/**
 * GameStateService — cerebro del juego.
 * Gestiona con RxJS todo el estado de la partida:
 *   - Vitalidad (desgaste por inactividad, smog, zonas verdes)
 *   - Fase del juego (matchmaking → countdown → playing → finished)
 *   - Sincronización con el servidor vía SocketService
 */
import { Injectable, OnDestroy }          from '@angular/core';
import { BehaviorSubject, Subject, interval, Subscription } from 'rxjs';
import { takeUntil }                       from 'rxjs/operators';
import { SocketService }                   from './socket.service';
import { IGameState, GamePhase, IGameResult } from '../interfaces/game-state.interface';
import { IPlayerState }                    from '../interfaces/player.interface';
import { IEnvironmentZone }                from '../interfaces/collectible.interface';

/** Tasa base de desgaste de vitalidad por segundo cuando el jugador está quieto */
const BASE_VITALITY_DRAIN   = 2;
/** Multiplicador en zona de smog */
const SMOG_MULTIPLIER       = 2;
/** Tasa de recuperación en zona verde (por segundo) */
const GREEN_RECOVERY_RATE   = 1;
/** Intervalo del tick de vitalidad en ms */
const VITALITY_TICK_MS      = 500;

const INITIAL_STATE: IGameState = {
  phase:        'idle',
  roomId:       null,
  localPlayer:  null,
  opponent:     null,
  countdown:    0,
  gameDuration: 0,
  collectibles: [],
  zones:        [],
  winner:       null
};

@Injectable({ providedIn: 'root' })
export class GameStateService implements OnDestroy {

  // Estado público como Observable
  private _state$ = new BehaviorSubject<IGameState>({ ...INITIAL_STATE });
  readonly state$  = this._state$.asObservable();

  // Señal de destrucción para limpiar suscripciones
  private destroy$ = new Subject<void>();

  // Evita registrar listeners duplicados
  private listenersRegistered = false;

  // Suscripciones internas
  private vitalityTick$?: Subscription;
  private durationTick$?: Subscription;

  constructor(private socket: SocketService) {
    // Los listeners se registran en startMatchmaking(),
    // después de que connect() haya creado el socket.
  }

  // ─── Getters de conveniencia ──────────────────────────────────────────────

  get snapshot(): IGameState { return this._state$.getValue(); }

  // ─── Acciones públicas ────────────────────────────────────────────────────

  /** Inicia partida local (2 jugadores mismo PC) sin socket */
  startLocalGame(username: string): void {
    const localPlayer = {
      socketId:    'local_p1',
      username,
      characterId: 'char_runner',
      vitality:    100,
      score:       0,
      position:    { x: 0, y: 0 },
      isMoving:    false,
      isInSmog:    false,
      isInGreen:   false
    };
    this._state$.next({
      ...INITIAL_STATE,
      phase:       'playing',
      localPlayer,
      gameDuration: 0
    });
    this.startTicks();
  }

  /** Inicia el proceso de matchmaking */
  startMatchmaking(username: string, characterId: string): void {
    this.socket.connect();
    // Registra listeners DESPUÉS de conectar
    this.listenToSocketEvents();
    this.setPhase('matchmaking');
    this.socket.joinGame(username, characterId);
  }

  /** Confirma que el jugador está listo */
  setReady(): void {
    const { roomId } = this.snapshot;
    if (roomId) this.socket.sendReady(roomId);
  }

  /** Actualiza posición y estado del jugador local (llamado cada frame desde Phaser) */
  updateLocalPlayer(patch: Partial<IPlayerState>): void {
    const state = this.snapshot;
    if (!state.localPlayer) return;

    const updated = { ...state.localPlayer, ...patch };
    this._state$.next({ ...state, localPlayer: updated });

    // Sincroniza con el servidor
    if (state.roomId) {
      this.socket.sendPlayerUpdate(
        state.roomId,
        updated.position,
        updated.vitality,
        updated.score
      );
    }
  }

  /** Registra las zonas de entorno generadas por Phaser */
  setZones(zones: IEnvironmentZone[]): void {
    this._state$.next({ ...this.snapshot, zones });
  }

  /** Reinicia el estado para una nueva partida */
  reset(): void {
    this.stopTicks();
    this.listenersRegistered = false;
    this.destroy$.next();          // cancela suscripciones anteriores
    this._state$.next({ ...INITIAL_STATE });
  }

  // ─── Lógica de vitalidad ──────────────────────────────────────────────────

  /**
   * Tick de vitalidad ejecutado cada VITALITY_TICK_MS.
   * Aplica desgaste por inactividad y smog, recuperación en zonas verdes.
   */
  private applyVitalityTick(): void {
    const state = this.snapshot;
    if (state.phase !== 'playing' || !state.localPlayer) return;

    const player = state.localPlayer;
    let drain    = 0;
    let recovery = 0;

    // Zona verde: recupera vitalidad
    if (player.isInGreen) {
      recovery = GREEN_RECOVERY_RATE * (VITALITY_TICK_MS / 1000);
    } else {
      // Desgaste base si está quieto
      if (!player.isMoving) {
        drain += BASE_VITALITY_DRAIN * (VITALITY_TICK_MS / 1000);
      }
      // Smog duplica el desgaste
      if (player.isInSmog) {
        drain += BASE_VITALITY_DRAIN * SMOG_MULTIPLIER * (VITALITY_TICK_MS / 1000);
      }
    }

    const newVitality = Math.max(0, Math.min(100, player.vitality - drain + recovery));
    this.updateLocalPlayer({ vitality: newVitality });

    // Si la vitalidad llega a 0, el jugador pierde
    if (newVitality === 0) {
      this.endGame();
    }
  }

  /** Termina la partida y notifica al servidor */
  endGame(): void {
    const state = this.snapshot;
    if (state.phase === 'finished') return;

    this.stopTicks();
    this.setPhase('finished');

    const players = [state.localPlayer, state.opponent]
      .filter(Boolean)
      .map(p => ({
        socketId:      p!.socketId,
        username:      p!.username,
        score:         p!.score,
        finalVitality: p!.vitality,
        winner:        p!.vitality > 0
      }));

    if (state.roomId) {
      this.socket.sendGameEnd(state.roomId, state.gameDuration, players as any);
    }
  }

  // ─── Socket listeners ─────────────────────────────────────────────────────

  private listenToSocketEvents(): void {
    if (this.listenersRegistered) return;
    this.listenersRegistered = true;

    // Unido a sala — guarda datos y envía ready automáticamente
    this.socket.onJoined()
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ roomId, socketId, existingPlayers }) => {
        const state = this.snapshot;
        const localPlayer: IPlayerState = {
          socketId,
          username:    state.localPlayer?.username    ?? '',
          characterId: state.localPlayer?.characterId ?? '',
          vitality:    100,
          score:       0,
          position:    { x: 100, y: 300 },
          isMoving:    false,
          isInSmog:    false,
          isInGreen:   false
        };

        // Si ya hay jugadores en la sala, el primero es el oponente
        const opponent = existingPlayers.length > 0 ? existingPlayers[0] : null;

        this._state$.next({ ...state, roomId, localPlayer, opponent });

        // Notifica al servidor que este jugador está listo
        this.socket.sendReady(roomId);
      });

    // Oponente se unió
    this.socket.onPlayerJoined()
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ socketId, username, characterId }) => {
        const opponent: IPlayerState = {
          socketId, username, characterId,
          vitality: 100, score: 0,
          position: { x: 700, y: 300 },
          isMoving: false, isInSmog: false, isInGreen: false
        };
        this._state$.next({ ...this.snapshot, opponent });
      });

    // Cuenta regresiva
    this.socket.onStartCountdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ countdown }) => {
        this.setPhase('countdown');
        this._state$.next({ ...this.snapshot, countdown });
      });

    // Partida empieza
    this.socket.onGameStart()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.setPhase('playing');
        this.startTicks();
      });

    // Actualización del oponente
    this.socket.onOpponentUpdate()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        const state = this.snapshot;
        if (!state.opponent) return;
        this._state$.next({
          ...state,
          opponent: { ...state.opponent, ...data }
        });
      });

    // Resultados finales
    this.socket.onGameResults()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: IGameResult) => {
        const winner = result.players.find(p => p.winner)?.socketId ?? null;
        this._state$.next({ ...this.snapshot, phase: 'finished', winner });
      });

    // Oponente se desconectó
    this.socket.onOpponentDisconnected()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this._state$.next({ ...this.snapshot, phase: 'finished', winner: this.snapshot.localPlayer?.socketId ?? null });
        this.stopTicks();
      });
  }

  // ─── Helpers privados ─────────────────────────────────────────────────────

  private setPhase(phase: GamePhase): void {
    this._state$.next({ ...this.snapshot, phase });
  }

  private startTicks(): void {
    // Tick de vitalidad
    this.vitalityTick$ = interval(VITALITY_TICK_MS)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applyVitalityTick());

    // Contador de duración de partida (cada segundo)
    this.durationTick$ = interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this._state$.next({
          ...this.snapshot,
          gameDuration: this.snapshot.gameDuration + 1
        });
      });
  }

  private stopTicks(): void {
    this.vitalityTick$?.unsubscribe();
    this.durationTick$?.unsubscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopTicks();
  }
}
