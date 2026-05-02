/**
 * Modelo de sesiones de juego con PostgreSQL.
 * Usa transacciones para garantizar consistencia.
 */
import { pool } from '../config/database';

export interface ISessionPlayer {
  playerId?: number;
  username: string;
  finalVitality: number;
  score: number;
  winner: boolean;
}

export interface IGameSession {
  id?: number;
  roomId: string;
  players: ISessionPlayer[];
  duration: number;
  completedAt?: Date;
}

export const GameSessionModel = {

  async create(data: IGameSession): Promise<number> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const sessionRes = await client.query(
        `INSERT INTO game_sessions (room_id, duration)
         VALUES ($1, $2)
         RETURNING id`,
        [data.roomId, data.duration]
      );
      const sessionId = sessionRes.rows[0].id;

      for (const player of data.players) {
        await client.query(
          `INSERT INTO session_players
             (session_id, player_id, username, final_vitality, score, winner)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [sessionId, player.playerId || null, player.username,
           player.finalVitality, player.score, player.winner]
        );
      }

      await client.query('COMMIT');
      return sessionId;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};
