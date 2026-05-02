/**
 * Gateway de Socket.IO con validación de payloads.
 */
import { Server, Socket }  from 'socket.io';
import { GameRoomService } from '../services/GameRoom.service';
import { ScoreService }    from '../services/Score.service';

// ── Validadores de payloads ───────────────────────────────────────────────────

const isValidUsername = (v: unknown): v is string =>
  typeof v === 'string' && v.trim().length >= 2 && v.trim().length <= 50;

const isValidCharacterId = (v: unknown): v is string =>
  typeof v === 'string' && ['runner', 'survivor', 'guardian'].includes(v);

const isValidRoomId = (v: unknown): v is string =>
  typeof v === 'string' && v.length > 0 && v.length <= 100;

const isValidPosition = (v: unknown): v is { x: number; y: number } =>
  typeof v === 'object' && v !== null &&
  typeof (v as any).x === 'number' && typeof (v as any).y === 'number' &&
  isFinite((v as any).x) && isFinite((v as any).y);

const isValidVitality = (v: unknown): v is number =>
  typeof v === 'number' && v >= 0 && v <= 100 && isFinite(v);

const isValidScore = (v: unknown): v is number =>
  typeof v === 'number' && v >= 0 && v <= 999999 && isFinite(v);

const isValidDuration = (v: unknown): v is number =>
  typeof v === 'number' && v >= 0 && v <= 3600 && isFinite(v);

// ── Gateway ───────────────────────────────────────────────────────────────────

interface JoinPayload   { username: string; characterId: string; }
interface UpdatePayload { roomId: string; position: { x: number; y: number }; vitality: number; score: number; }
interface EndPayload    { roomId: string; duration: number; players: any[]; }

export const setupGameGateway = (io: Server): void => {
  const roomService  = new GameRoomService(io);
  const scoreService = new ScoreService();

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Conectado: ${socket.id}`);

    socket.on('game:join', (payload: JoinPayload) => {
      if (!isValidUsername(payload?.username) || !isValidCharacterId(payload?.characterId)) {
        socket.emit('game:error', { message: 'Datos de jugador inválidos' });
        return;
      }
      const { roomId, existingPlayers } = roomService.joinOrCreateRoom(socket, {
        username:    payload.username.trim(),
        characterId: payload.characterId
      });
      socket.emit('game:joined', { roomId, socketId: socket.id, existingPlayers });
      socket.to(roomId).emit('game:player_joined', { socketId: socket.id, ...payload });
    });

    socket.on('game:ready', ({ roomId }: { roomId: string }) => {
      if (!isValidRoomId(roomId)) return;
      const allReady = roomService.setPlayerReady(roomId, socket.id);
      if (allReady) {
        io.to(roomId).emit('game:start_countdown', { countdown: 3 });
        setTimeout(() => io.to(roomId).emit('game:start'), 3000);
      }
    });

    socket.on('game:player_update', (payload: UpdatePayload) => {
      if (!isValidRoomId(payload?.roomId)       ||
          !isValidPosition(payload?.position)   ||
          !isValidVitality(payload?.vitality)   ||
          !isValidScore(payload?.score)) return;

      roomService.updatePlayerState(payload.roomId, socket.id, {
        position: payload.position,
        vitality: payload.vitality,
        score:    payload.score
      });
      socket.to(payload.roomId).emit('game:opponent_update', {
        socketId: socket.id,
        ...payload
      });
    });

    socket.on('game:end', async (payload: EndPayload) => {
      if (!isValidRoomId(payload?.roomId) || !isValidDuration(payload?.duration)) return;
      if (!Array.isArray(payload.players) || payload.players.length > 2) return;

      try {
        await scoreService.saveSession({
          roomId:      payload.roomId,
          players:     payload.players,
          duration:    payload.duration,
          completedAt: new Date()
        });
        io.to(payload.roomId).emit('game:results', { players: payload.players });
      } catch (err: any) {
        console.error('Error guardando sesión:', err.message);
      }
    });

    socket.on('disconnect', () => {
      const result = roomService.removePlayer(socket.id);
      if (result) {
        io.to(result.roomId).emit('game:opponent_disconnected');
        console.log(`🔌 Desconectado: ${socket.id} de sala ${result.roomId}`);
      } else {
        console.log(`🔌 Desconectado: ${socket.id}`);
      }
    });
  });
};
