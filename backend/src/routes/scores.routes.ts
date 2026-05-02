/**
 * Ruta REST para el leaderboard.
 * GET /api/scores/leaderboard → top 10 jugadores
 */
import { Router, Request, Response } from 'express';
import { ScoreService } from '../services/Score.service';

const router       = Router();
const scoreService = new ScoreService();

router.get('/leaderboard', async (_req: Request, res: Response) => {
  try {
    const data = await scoreService.getLeaderboard();
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, message: 'Error obteniendo leaderboard' });
  }
});

export default router;
