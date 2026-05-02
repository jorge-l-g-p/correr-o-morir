/**
 * GameComponent — contenedor de la pantalla de juego.
 * Combina el GameEngine (Phaser) con el HUD (Angular).
 * Si el jugador llega aquí sin estar en una partida, redirige al menú.
 */
import { Component, OnInit }  from '@angular/core';
import { CommonModule }        from '@angular/common';
import { Router }              from '@angular/router';
import { GameEngineComponent } from './engine/game-engine.component';
import { HudComponent }        from './hud/hud.component';
import { GameStateService }    from '../../core/services/game-state.service';

@Component({
  selector:    'app-game',
  standalone:  true,
  imports:     [CommonModule, GameEngineComponent, HudComponent],
  templateUrl: './game.component.html',
  styleUrl:    './game.component.scss'
})
export class GameComponent implements OnInit {

  constructor(
    private gameState: GameStateService,
    private router:    Router
  ) {}

  ngOnInit(): void {
    const phase = this.gameState.snapshot.phase;
    if (phase === 'idle' || phase === 'finished') {
      this.router.navigate(['/']);
    }
  }
}
