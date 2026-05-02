import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { Router }        from '@angular/router';
import { GameStateService } from '../../core/services/game-state.service';

@Component({
  selector:    'app-player-selection',
  standalone:  true,
  imports:     [CommonModule],
  templateUrl: './player-selection.component.html',
  styleUrl:    './player-selection.component.scss'
})
export class PlayerSelectionComponent implements OnInit {

  name1    = signal('');
  name2    = signal('');
  errorMsg = signal('');

  constructor(private gameState: GameStateService, private router: Router) {}

  ngOnInit(): void {
    this.gameState.reset();
    // Limpiar nombres previos
    (window as any).__p2State = null;
  }

  startGame(): void {
    const n1 = this.name1().trim();
    const n2 = this.name2().trim();

    if (!n1 || !n2) {
      this.errorMsg.set('Ambos jugadores deben ingresar su nombre');
      return;
    }
    if (n1.length < 2 || n2.length < 2) {
      this.errorMsg.set('Los nombres deben tener al menos 2 caracteres');
      return;
    }

    this.errorMsg.set('');

    // Guardar nombre de J2 en window para que Phaser lo use
    (window as any).__p2State = { vitality: 100, score: 0, username: n2 };

    // Iniciar estado local con nombre de J1
    this.gameState.startLocalGame(n1);
    this.router.navigate(['/game']);
  }
}
