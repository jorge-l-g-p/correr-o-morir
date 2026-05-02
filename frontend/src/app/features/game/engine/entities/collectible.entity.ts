/**
 * CollectibleEntity — clase base para todos los coleccionables.
 * Frutos naturales (restauran vitalidad) y plantas trampa (restan vitalidad).
 * Cada subclase define su comportamiento al ser recogido.
 */
import Phaser from 'phaser';
import { ICollectible } from '../../../../core/interfaces/collectible.interface';

export abstract class CollectibleEntity extends Phaser.Physics.Arcade.Sprite {

  readonly data_id:       string;
  readonly vitalityDelta: number;
  readonly scoreValue:    number;
  isCollected:            boolean = false;

  constructor(scene: Phaser.Scene, config: ICollectible) {
    super(scene, config.x, config.y, config.spriteKey);

    this.data_id       = config.id;
    this.vitalityDelta = config.vitalityDelta;
    this.scoreValue    = config.scoreValue;

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // body estático

    this.addFloatAnimation();
  }

  /** Efecto de flotación suave */
  private addFloatAnimation(): void {
    this.scene.tweens.add({
      targets:  this,
      y:        this.y - 6,
      duration: 1200,
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.easeInOut'
    });
  }

  /** Llamado cuando un jugador lo toca */
  collect(): { vitalityDelta: number; scoreValue: number } {
    if (this.isCollected) return { vitalityDelta: 0, scoreValue: 0 };
    this.isCollected = true;
    this.playCollectEffect();
    this.destroy();
    return { vitalityDelta: this.vitalityDelta, scoreValue: this.scoreValue };
  }

  /** Efecto visual al recoger — cada subclase puede sobreescribir */
  protected playCollectEffect(): void {
    this.scene.tweens.add({
      targets:  this,
      scaleX:   2,
      scaleY:   2,
      alpha:    0,
      duration: 200,
      ease:     'Power2'
    });
  }
}

/** Fruto natural — colores orgánicos, restaura vitalidad */
export class NaturalFruitEntity extends CollectibleEntity {
  protected override playCollectEffect(): void {
    // Partículas verdes/doradas
    const particles = this.scene.add.particles(this.x, this.y, 'fruit_apple', {
      speed:    { min: 50, max: 150 },
      scale:    { start: 0.5, end: 0 },
      lifespan: 400,
      quantity: 8
    });
    this.scene.time.delayedCall(500, () => particles.destroy());
    super.playCollectEffect();
  }
}

/** Planta trampa — colores neón, resta vitalidad */
export class TrapPlantEntity extends CollectibleEntity {

  private warningCircle!: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene, config: ICollectible & { warningRadius?: number }) {
    super(scene, config);
    // Círculo de advertencia pulsante
    this.warningCircle = scene.add.circle(
      config.x, config.y,
      config.warningRadius ?? 40,
      0xFF00FF, 0.15
    );
    scene.tweens.add({
      targets:  this.warningCircle,
      alpha:    0.35,
      duration: 800,
      yoyo:     true,
      repeat:   -1
    });
  }

  override destroy(fromScene?: boolean): void {
    this.warningCircle?.destroy();
    super.destroy(fromScene);
  }

  protected override playCollectEffect(): void {
    // Flash rojo en pantalla
    const flash = this.scene.add.rectangle(
      this.scene.scale.width / 2,
      this.scene.scale.height / 2,
      this.scene.scale.width,
      this.scene.scale.height,
      0xFF0000, 0.4
    ).setDepth(100);
    this.scene.tweens.add({
      targets: flash, alpha: 0, duration: 300,
      onComplete: () => flash.destroy()
    });
    super.playCollectEffect();
  }
}
