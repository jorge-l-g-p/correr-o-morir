/**
 * Interfaces para coleccionables del juego.
 * Clase base Collectible con dos subtipos:
 *   - NaturalFruit: restaura vitalidad (colores orgánicos)
 *   - TrapPlant:    resta vitalidad  (colores neón/saturados)
 */

export type CollectibleType = 'fruit' | 'trap';

export interface ICollectible {
  id:          string;
  type:        CollectibleType;
  x:           number;
  y:           number;
  spriteKey:   string;
  vitalityDelta: number;  // positivo = restaura, negativo = daña
  scoreValue:  number;    // puntos al recogerlo
  isCollected: boolean;
}

/** Fruto natural — colores cálidos/orgánicos, restaura salud */
export interface INaturalFruit extends ICollectible {
  type:        'fruit';
  fruitKind:   'apple' | 'orange' | 'berry' | 'melon';
}

/** Planta trampa — colores neón/saturados, resta vitalidad */
export interface ITrapPlant extends ICollectible {
  type:        'trap';
  trapKind:    'neon_mushroom' | 'toxic_flower' | 'spiky_cactus';
  /** Radio visual de advertencia en píxeles */
  warningRadius: number;
}

/** Zona del entorno que afecta la vitalidad pasivamente */
export interface IEnvironmentZone {
  id:              string;
  kind:            'smog' | 'green';
  x:               number;
  y:               number;
  width:           number;
  height:          number;
  /** Multiplicador de desgaste: smog = 2, green = 0 */
  vitalityModifier: number;
}
