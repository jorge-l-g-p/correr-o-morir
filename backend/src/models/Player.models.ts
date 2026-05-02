/**
 * Modelo de jugadores con PostgreSQL.
 */
import { pool } from '../config/database';

export interface IPlayer {
  id?: number;
  username: string;
  characterId: string;
  highScore: number;
  totalGames: number;
  createdAt?: Date;
}

export const PlayerModel = {

  async create(data: Pick<IPlayer, 'username' | 'characterId'>): Promise<IPlayer> {
    const res = await pool.query(
      `INSERT INTO players (username, character_id)
       VALUES ($1, $2)
       RETURNING id`,
      [data.username, data.characterId]
    );
    return {
      id:          res.rows[0].id,
      username:    data.username,
      characterId: data.characterId,
      highScore:   0,
      totalGames:  0
    };
  },

  async findById(id: number): Promise<IPlayer | null> {
    const res = await pool.query(
      `SELECT id, username, character_id, high_score, total_games, created_at
       FROM players WHERE id = $1`,
      [id]
    );
    if (!res.rows.length) return null;
    const r = res.rows[0];
    return {
      id:          r.id,
      username:    r.username,
      characterId: r.character_id,
      highScore:   r.high_score,
      totalGames:  r.total_games,
      createdAt:   r.created_at
    };
  },

  async updateStats(id: number, newScore: number): Promise<void> {
    await pool.query(
      `UPDATE players
       SET high_score  = GREATEST(high_score, $1),
           total_games = total_games + 1
       WHERE id = $2`,
      [newScore, id]
    );
  },

  async getLeaderboard(): Promise<IPlayer[]> {
    const res = await pool.query(
      `SELECT id, username, character_id, high_score, total_games
       FROM players
       ORDER BY high_score DESC
       LIMIT 10`
    );
    return res.rows.map(r => ({
      id:          r.id,
      username:    r.username,
      characterId: r.character_id,
      highScore:   r.high_score,
      totalGames:  r.total_games
    }));
  }
};
