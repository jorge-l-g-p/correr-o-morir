/**
 * Rutas REST para jugadores.
 * POST /api/players     → registrar jugador nuevo
 * GET  /api/players/:id → obtener datos de un jugador
 */
import { Router, Request, Response } from 'express';
import { PlayerModel } from '../models/Player.models';

const router = Router();

/** Valida y sanitiza el username */
const validateUsername = (username: unknown): string | null => {
  if (typeof username !== 'string') return null;
  const trimmed = username.trim();
  if (trimmed.length < 2 || trimmed.length > 50) return null;
  // Solo letras, números, guiones y guiones bajos
  if (!/^[a-zA-Z0-9_\-áéíóúÁÉÍÓÚñÑ ]+$/.test(trimmed)) return null;
  return trimmed;
};

/** Valida el characterId contra valores permitidos */
const VALID_CHARACTERS = ['runner', 'survivor', 'guardian'];
const validateCharacterId = (id: unknown): string | null => {
  if (typeof id !== 'string') return null;
  return VALID_CHARACTERS.includes(id) ? id : null;
};

router.post('/', async (req: Request, res: Response) => {
  try {
    const username    = validateUsername(req.body.username);
    const characterId = validateCharacterId(req.body.characterId);

    if (!username)    return res.status(400).json({ success: false, message: 'Username inválido (2-50 caracteres, sin caracteres especiales)' });
    if (!characterId) return res.status(400).json({ success: false, message: 'Personaje no válido' });

    const player = await PlayerModel.create({ username, characterId });
    res.status(201).json({ success: true, data: player });
  } catch (error: any) {
    // Error de username duplicado (unique constraint)
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'Username ya existe' });
    }
    console.error('Error creando jugador:', error.message);
    res.status(500).json({ success: false, message: 'Error creando jugador' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }
    const player = await PlayerModel.findById(id);
    if (!player) return res.status(404).json({ success: false, message: 'Jugador no encontrado' });
    res.json({ success: true, data: player });
  } catch (error: any) {
    console.error('Error obteniendo jugador:', error.message);
    res.status(500).json({ success: false, message: 'Error obteniendo jugador' });
  }
});

export default router;
