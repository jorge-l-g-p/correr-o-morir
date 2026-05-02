/**
 * Interfaces para jugadores.
 * IPlayer: datos persistentes (BD).
 * IPlayerState: estado en tiempo real durante la partida.
 */

export interface IPlayer {
  id?: number;
  username: string;
  characterId: string;
  highScore: number;
  totalGames: number;
}

/** Estado en tiempo real de un jugador dentro de la partida */
export interface IPlayerState {
  socketId:    string;
  username:    string;
  characterId: string;
  vitality:    number;   // 0–100
  score:       number;
  position:    { x: number; y: number };
  isMoving:    boolean;
  isInSmog:    boolean;  // true si está en zona de tráfico denso
  isInGreen:   boolean;  // true si está en zona verde
}

/** Personaje seleccionable en la galería */
export interface ICharacter {
  id:          string;
  name:        string;
  description: string;
  spriteKey:   string;   // clave del asset en Phaser
  color:       string;   // color representativo para UI
  speed:       number;   // multiplicador de velocidad base (0.8–1.2)
}

/** Controles mapeados por jugador */
export interface IPlayerControls {
  up:    string;
  down:  string;
  left:  string;
  right: string;
}
