import { Component, OnDestroy, AfterViewInit } from '@angular/core';
import Phaser from 'phaser';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GameStateService } from '../../../core/services/game-state.service';
import { PreloadScene } from './scenes/preload.scene';
import { GameScene } from './scenes/game.scene';
import { IGameState } from '../../../core/interfaces/game-state.interface';
import { IEnvironmentZone } from '../../../core/interfaces/collectible.interface';
import { IPlayerState } from '../../../core/interfaces/player.interface';

export interface PhaserBridge {
  getState:    () => IGameState;
  updateLocal: (patch: Partial<IPlayerState>) => void;
  setZones:    (zones: IEnvironmentZone[]) => void;
  endGame:     () => void;
}

@Component({
  selector:   'app-game-engine',
  standalone: true,
  template:   `<div id="phaser-container"></div>`,
  styles: [`
    :host { display: block; width: 100vw; height: 100vh; }
    #phaser-container { width: 100vw; height: 100vh; }
    #phaser-container canvas { display: block; }
  `]
})
export class GameEngineComponent implements AfterViewInit, OnDestroy {

  private game!: Phaser.Game;
  private destroy$ = new Subject<void>();

  constructor(private gameState: GameStateService, private router: Router) {}

  ngAfterViewInit(): void {
    // Bridge global para las escenas
    (window as any).__phaserBridge = {
      getState:    () => this.gameState.snapshot,
      updateLocal: (p: Partial<IPlayerState>) => this.gameState.updateLocalPlayer(p),
      setZones:    (z: IEnvironmentZone[]) => this.gameState.setZones(z),
      endGame:     () => this.gameState.endGame()
    } as PhaserBridge;

    // Pequeño delay para asegurar que el DOM está listo
    setTimeout(() => this.startPhaser(), 100);
  }

  private startPhaser(): void {
    const W = window.innerWidth;
    const H = window.innerHeight;

    this.game = new Phaser.Game({
      type:            Phaser.CANVAS,
      width:           W,
      height:          H,
      parent:          'phaser-container',
      backgroundColor: '#2C2C2C',
      physics: {
        default: 'arcade',
        arcade:  { gravity: { x: 0, y: 0 }, debug: false }
      },
      scene: [PreloadScene, GameScene]
    });

    // Escuchar fin de partida desde Angular
    this.gameState.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        if (state.phase === 'finished' && this.game?.scene.isActive('GameScene')) {
          // La escena maneja su propia pantalla de resultados
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    (window as any).__phaserBridge = null;
    this.game?.destroy(true);
  }
}
