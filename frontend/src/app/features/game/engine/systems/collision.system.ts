/**
 * CollisionSystem — detecta colisiones entre jugadores y coleccionables.
 * Cuando hay colisión, aplica el efecto del coleccionable al jugador
 * y notifica al GameStateService.
 */
import Phaser from 'phaser';
import { CollectibleEntity } from '../entities/collectible.entity';
import { PlayerEntity }      from '../entities/player.entity';

export type CollectCallback = (vitalityDelta: number, scoreValue: number) => void;

export class CollisionSystem {

  constructor(private scene: Phaser.Scene) {}

  /**
   * Registra colisiones entre el jugador local y el grupo de coleccionables.
   * onCollect se llama con el delta de vitalidad y puntos obtenidos.
   */
  registerPlayerCollectibles(
    player:      PlayerEntity,
    collectibles: Phaser.GameObjects.Group,
    onCollect:   CollectCallback
  ): void {
    this.scene.physics.add.overlap(
      player,
      collectibles,
      (_player, collectibleObj) => {
        const collectible = collectibleObj as CollectibleEntity;
        if (collectible.isCollected) return;
        const result = collectible.collect();
        onCollect(result.vitalityDelta, result.scoreValue);
      }
    );
  }

  /**
   * Registra colisión entre jugadores (empuje físico).
   */
  registerPlayerVsPlayer(p1: PlayerEntity, p2: PlayerEntity): void {
    this.scene.physics.add.collider(p1, p2);
  }
}
