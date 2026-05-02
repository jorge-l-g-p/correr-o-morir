/**
 * Catálogo de personajes seleccionables.
 * Cada personaje tiene stats distintos que afectan la jugabilidad.
 */
import { ICharacter } from '../interfaces/player.interface';

export const CHARACTERS: ICharacter[] = [
  {
    id:          'runner',
    name:        'El Corredor',
    description: 'Veloz pero frágil. Ideal para esquivar trampas rápido.',
    spriteKey:   'char_runner',
    color:       '#FF6B35',
    speed:       1.2
  },
  {
    id:          'survivor',
    name:        'La Superviviente',
    description: 'Equilibrada. Resiste mejor el smog de la ciudad.',
    spriteKey:   'char_survivor',
    color:       '#4ECDC4',
    speed:       1.0
  },
  {
    id:          'guardian',
    name:        'El Guardián',
    description: 'Lento pero resistente. Las plantas trampa le hacen menos daño.',
    spriteKey:   'char_guardian',
    color:       '#45B7D1',
    speed:       0.8
  }
];
