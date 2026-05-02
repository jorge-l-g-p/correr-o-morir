/**
 * Rutas REST para jugadores.
 * POST /api/players     → registrar jugador nuevo
 * GET  /api/players/:id → obtener datos de un jugador
 */
import { Router, Request, Response } from 'express';
import { PlayerModel } from '../models/Player.models';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { username, characterId } = req.body;
    if (!username || !characterId)
      return res.status(400).json({ success: false, message: 'Faltan campos requeridos' });

    const player = await PlayerModel.create({ username, characterId });
    res.status(201).json({ success: true, data: player });
  } catch (error: any) {
    if (error.message?.includes('ORA-00001'))
      return res.status(409).json({ success: false, message: 'Username ya existe' });
    res.status(500).json({ success: false, message: 'Error creando jugador' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const player = await PlayerModel.findById(Number(req.params.id));
    if (!player)
      return res.status(404).json({ success: false, message: 'Jugador no encontrado' });
    res.json({ success: true, data: player });
  } catch {
    res.status(500).json({ success: false, message: 'Error obteniendo jugador' });
  }
});

export default router;
