/**
 * ResultsScene — pantalla de resultados al terminar la partida.
 * Muestra ganador, puntuaciones y botón para volver al menú.
 */
import Phaser from 'phaser';
import { IGameState } from '../../../../core/interfaces/game-state.interface';

export class ResultsScene extends Phaser.Scene {

  private onReturnCallback!: () => void;
  private state!: IGameState;

  constructor() { super({ key: 'ResultsScene' }); }

  init(data: { state: IGameState; onReturn: () => void }): void {
    this.state            = data.state;
    this.onReturnCallback = data.onReturn;
  }

  create(): void {
    const { width, height } = this.scale;

    // Fondo semitransparente
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);

    const isWinner = this.state.winner === this.state.localPlayer?.socketId;
    const title    = isWinner ? '🏆 ¡GANASTE!' : '💀 PERDISTE';
    const color    = isWinner ? '#ffd700' : '#e63946';

    // Título
    this.add.text(width / 2, height / 2 - 120, title, {
      fontSize: '52px', color,
      stroke: '#000', strokeThickness: 6
    }).setOrigin(0.5);

    // Resultados de jugadores
    const players = [this.state.localPlayer, this.state.opponent].filter(Boolean);
    players.forEach((p, i) => {
      const y = height / 2 - 40 + i * 60;
      const label = p!.socketId === this.state.localPlayer?.socketId ? '(Tú)' : '(Oponente)';
      this.add.text(width / 2, y,
        `${p!.username} ${label}  —  ${p!.score} pts  |  Vitalidad: ${Math.round(p!.vitality)}%`,
        { fontSize: '18px', color: '#ffffff', stroke: '#000', strokeThickness: 3 }
      ).setOrigin(0.5);
    });

    // Duración
    const mins = Math.floor(this.state.gameDuration / 60);
    const secs = this.state.gameDuration % 60;
    this.add.text(width / 2, height / 2 + 80,
      `Duración: ${mins}m ${secs}s`,
      { fontSize: '16px', color: 'rgba(255,255,255,0.6)' }
    ).setOrigin(0.5);

    // Botón volver
    const btn = this.add.text(width / 2, height / 2 + 130, '[ Volver al Menú ]', {
      fontSize: '22px', color: '#ff6b35',
      stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover',  () => btn.setColor('#ffd700'));
    btn.on('pointerout',   () => btn.setColor('#ff6b35'));
    btn.on('pointerdown',  () => this.onReturnCallback());
  }
}
