/**
 * Configuración del pool de conexiones PostgreSQL.
 * Usa pg.Pool para reutilizar conexiones eficientemente.
 */
import { Pool } from 'pg';

export const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'correr_morir',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'GamePass2026',
  max:      10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const connectDatabase = async (): Promise<void> => {
  const client = await pool.connect();
  client.release();
  console.log('✅ PostgreSQL conectado');
};

/** Ejecuta el SQL de inicialización si las tablas no existen */
export const initSchema = async (): Promise<void> => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS players (
      id           SERIAL PRIMARY KEY,
      username     VARCHAR(50) UNIQUE NOT NULL,
      character_id VARCHAR(50) NOT NULL,
      high_score   INTEGER DEFAULT 0,
      total_games  INTEGER DEFAULT 0,
      created_at   TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS game_sessions (
      id           SERIAL PRIMARY KEY,
      room_id      VARCHAR(100) NOT NULL,
      duration     INTEGER NOT NULL,
      completed_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS session_players (
      id             SERIAL PRIMARY KEY,
      session_id     INTEGER REFERENCES game_sessions(id),
      player_id      INTEGER REFERENCES players(id),
      username       VARCHAR(50) NOT NULL,
      final_vitality INTEGER NOT NULL,
      score          INTEGER NOT NULL,
      winner         BOOLEAN NOT NULL
    );
  `);
  console.log('✅ Schema inicializado');
};
