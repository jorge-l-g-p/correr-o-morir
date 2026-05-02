/**
 * Gestiona salas de juego en memoria RAM.
 * Las salas son temporales, solo existen mientras dura la partida.
 * Se destruyen automáticamente cuando todos los jugadores se van.
 */
import { Server, Socket } from 'socket.io';

interface RoomPlayer {
  socketId:    string;
  username:    string;
  characterId: string;
  vitality:    number;
  score:       number;
  position:    { x: number; y: number };
  isReady:     boolean;
}

interface GameRoom {
  id:         string;
  players:    Map<string, RoomPlayer>;
  isActive:   boolean;
  startTime?: number;
}

export type { RoomPlayer, GameRoom };

export class GameRoomService {
  private rooms = new Map<string, GameRoom>();

  constructor(private io: Server) {}

  /** Une al jugador a una sala existente o crea una nueva. Retorna roomId y jugadores existentes */
  joinOrCreateRoom(
    socket: Socket,
    playerData: Pick<RoomPlayer, 'username' | 'characterId'>
  ): { roomId: string; existingPlayers: Omit<RoomPlayer, 'isReady'>[] } {
    let targetRoom = [...this.rooms.values()].find(
      r => r.players.size < 2 && !r.isActive
    );

    if (!targetRoom) {
      const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      targetRoom   = { id: roomId, players: new Map(), isActive: false };
      this.rooms.set(roomId, targetRoom);
    }

    // Captura jugadores existentes ANTES de agregar al nuevo
    const existingPlayers = [...targetRoom.players.values()].map(
      ({ isReady, ...p }) => p
    );

    targetRoom.players.set(socket.id, {
      ...playerData,
      socketId: socket.id,
      vitality: 100,
      score:    0,
      position: { x: 100, y: 300 },
      isReady:  false
    });

    socket.join(targetRoom.id);
    return { roomId: targetRoom.id, existingPlayers };
  }

  /** Marca jugador como listo. Retorna true si todos están listos */
  setPlayerReady(roomId: string, socketId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const player = room.players.get(socketId);
    if (player) player.isReady = true;

    const allReady =
      room.players.size === 2 &&
      [...room.players.values()].every(p => p.isReady);

    if (allReady) {
      room.isActive  = true;
      room.startTime = Date.now();
    }

    return allReady;
  }

  /** Actualiza posición y estado de un jugador */
  updatePlayerState(roomId: string, socketId: string, state: Partial<RoomPlayer>): void {
    const player = this.rooms.get(roomId)?.players.get(socketId);
    if (player) Object.assign(player, state);
  }

  /** Elimina jugador y destruye la sala si queda vacía. Retorna roomId y snapshot de jugadores */
  removePlayer(socketId: string): { roomId: string; players: RoomPlayer[] } | null {
    for (const [roomId, room] of this.rooms) {
      if (room.players.has(socketId)) {
        const players = [...room.players.values()];
        room.players.delete(socketId);
        if (room.players.size === 0) this.rooms.delete(roomId);
        return { roomId, players };
      }
    }
    return null;
  }
}
