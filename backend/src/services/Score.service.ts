/**
 * Servicio de puntuaciones.
 * Orquesta el guardado de sesiones y actualización
 * de estadísticas de cada jugador.
 */
import { PlayerModel } from '../models/Player.models';
import { GameSessionModel, IGameSession } from '../models/GameSession.model';

export class ScoreService {

  /** Guarda la sesión y actualiza el highScore de cada jugador */
  async saveSession(sessionData: IGameSession): Promise<void> {
    await GameSessionModel.create(sessionData);

    for (const player of sessionData.players) {
      if (player.playerId) {
        await PlayerModel.updateStats(player.playerId, player.score);
      }
    }
  }

  /** Retorna el top 10 del leaderboard */
  async getLeaderboard() {
    return PlayerModel.getLeaderboard();
  }
}
