/**
 * Gateway de Socket.IO.
 * Centraliza todos los eventos en tiempo real:
 * unirse, listo, mover, terminar partida, desconectar.
 */
import { Server, Socket }  from 'socket.io';
import { GameRoomService } from '../services/GameRoom.service';
import { ScoreService }    from '../services/Score.service';

interface JoinPayload   { username: string; characterId: string; }
interface UpdatePayload { roomId: string; position: { x: number; y: number }; vitality: number; score: number; }
interface EndPayload    { roomId: string; duration: number; players: any[]; }

export const setupGameGateway = (io: Server): void => {
  const roomService  = new GameRoomService(io);
  const scoreService = new ScoreService();

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Conectado: ${socket.id}`);

    // Jugador quiere entrar a una partida
    socket.on('game:join', (payload: JoinPayload) => {
      const { roomId, existingPlayers } = roomService.joinOrCreateRoom(socket, payload);
      // Le dice al nuevo jugador su roomId y quiénes ya estaban
      socket.emit('game:joined', { roomId, socketId: socket.id, existingPlayers });
      // Avisa SOLO a los jugadores que ya estaban en la sala (no al que acaba de unirse)
      socket.to(roomId).emit('game:player_joined', { socketId: socket.id, ...payload });
    });

    // Jugador confirma que está listo
    socket.on('game:ready', ({ roomId }: { roomId: string }) => {
      const allReady = roomService.setPlayerReady(roomId, socket.id);
      if (allReady) {
        io.to(roomId).emit('game:start_countdown', { countdown: 3 });
        setTimeout(() => io.to(roomId).emit('game:start'), 3000);
      }
    });

    // Actualización de posición cada frame (~30 veces por segundo)
    socket.on('game:player_update', (payload: UpdatePayload) => {
      roomService.updatePlayerState(payload.roomId, socket.id, {
        position: payload.position,
        vitality: payload.vitality,
        score:    payload.score
      });
      // Reenvía solo al oponente en la misma sala
      socket.to(payload.roomId).emit('game:opponent_update', {
        socketId: socket.id,
        ...payload
      });
    });

    // Partida terminada → guardar en Oracle
    socket.on('game:end', async (payload: EndPayload) => {
      try {
        await scoreService.saveSession({
          roomId:      payload.roomId,
          players:     payload.players,
          duration:    payload.duration,
          completedAt: new Date()
        });
        io.to(payload.roomId).emit('game:results', { players: payload.players });
      } catch (err) {
        console.error('Error guardando sesión:', err);
      }
    });

    // Jugador se desconecta
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
