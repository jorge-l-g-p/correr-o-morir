/**
 * Configuración del pool de conexiones PostgreSQL.
 * Las credenciales SIEMPRE vienen de variables de entorno.
 * Nunca hay valores por defecto de contraseñas en código.
 */
import { Pool } from 'pg';

if (!process.env.DB_PASSWORD) {
  console.error('ERROR: DB_PASSWORD no está definida en las variables de entorno');
  process.exit(1);
}

export const pool = new Pool({
  host:     process.env.DB_HOST || 'localhost',
  port:     Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'correr_morir',
  user:     process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,   // sin fallback — falla si no está definida
  max:      10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const connectDatabase = async (): Promise<void> => {
  const client = await pool.connect();
  client.release();
  console.log('✅ PostgreSQL conectado');
};

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
