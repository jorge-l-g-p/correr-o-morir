/**
 * SmogSystem — gestiona las zonas de entorno.
 * Detecta si el jugador está en zona de smog (tráfico denso)
 * o zona verde, y notifica al GameStateService para ajustar
 * el desgaste de vitalidad.
 */
import Phaser from 'phaser';
import { IEnvironmentZone } from '../../../../core/interfaces/collectible.interface';
import { PlayerEntity }     from '../entities/player.entity';

export class SmogSystem {

  private smogZones:  Phaser.GameObjects.Zone[] = [];
  private greenZones: Phaser.GameObjects.Zone[] = [];
  private smogVisuals:  Phaser.GameObjects.Rectangle[] = [];
  private greenVisuals: Phaser.GameObjects.Rectangle[] = [];

  constructor(private scene: Phaser.Scene) {}

  /** Crea las zonas a partir de la configuración */
  createZones(zones: IEnvironmentZone[]): void {
    for (const zone of zones) {
      const visual = this.scene.add.rectangle(
        zone.x + zone.width / 2,
        zone.y + zone.height / 2,
        zone.width,
        zone.height,
        zone.kind === 'smog' ? 0x8B4513 : 0x228B22,
        zone.kind === 'smog' ? 0.35 : 0.25
      ).setDepth(1);

      // Etiqueta de zona
      this.scene.add.text(
        zone.x + zone.width / 2,
        zone.y + 8,
        zone.kind === 'smog' ? '🚗 SMOG' : '🌿 ZONA VERDE',
        { fontSize: '11px', color: '#ffffff', stroke: '#000', strokeThickness: 2 }
      ).setOrigin(0.5, 0).setDepth(2);

      const phaserZone = this.scene.add.zone(
        zone.x + zone.width / 2,
        zone.y + zone.height / 2,
        zone.width,
        zone.height
      );
      this.scene.physics.world.enable(phaserZone);

      if (zone.kind === 'smog') {
        this.smogZones.push(phaserZone);
        this.smogVisuals.push(visual);
        // Efecto de partículas de smog
        this.addSmogParticles(zone);
      } else {
        this.greenZones.push(phaserZone);
        this.greenVisuals.push(visual);
      }
    }
  }

  /**
   * Comprueba en qué zona está el jugador.
   * Retorna { isInSmog, isInGreen }.
   */
  checkPlayerZone(player: PlayerEntity): { isInSmog: boolean; isInGreen: boolean } {
    const px = player.x;
    const py = player.y;

    const isInSmog  = this.smogZones.some(z  => this.pointInZone(px, py, z));
    const isInGreen = this.greenZones.some(z => this.pointInZone(px, py, z));

    return { isInSmog, isInGreen };
  }

  private pointInZone(px: number, py: number, zone: Phaser.GameObjects.Zone): boolean {
    const hw = zone.width  / 2;
    const hh = zone.height / 2;
    return px >= zone.x - hw && px <= zone.x + hw &&
           py >= zone.y - hh && py <= zone.y + hh;
  }

  private addSmogParticles(zone: IEnvironmentZone): void {
    // Partículas de humo sutiles
    this.scene.add.particles(
      zone.x + zone.width / 2,
      zone.y + zone.height / 2,
      'tile_smog',
      {
        x:        { min: -zone.width / 2,  max: zone.width / 2 },
        y:        { min: -zone.height / 2, max: zone.height / 2 },
        alpha:    { start: 0.3, end: 0 },
        scale:    { start: 0.5, end: 1.5 },
        speed:    { min: 5, max: 20 },
        lifespan: 3000,
        quantity: 1,
        frequency: 400
      }
    ).setDepth(3);
  }
}
