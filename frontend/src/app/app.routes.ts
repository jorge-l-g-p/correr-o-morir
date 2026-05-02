/**
 * Rutas de la aplicación.
 *   /              → Selección de personaje y matchmaking
 *   /game          → Pantalla de juego (Phaser + HUD)
 *   /leaderboard   → Top 10 jugadores
 */
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path:         '',
    loadComponent: () =>
      import('./features/player-selection/player-selection.component')
        .then(m => m.PlayerSelectionComponent)
  },
  {
    path:         'game',
    loadComponent: () =>
      import('./features/game/game.component')
        .then(m => m.GameComponent)
  },
  {
    path:         'leaderboard',
    loadComponent: () =>
      import('./features/leaderboard/leaderboard.component')
        .then(m => m.LeaderboardComponent)
  },
  {
    path:       '**',
    redirectTo: ''
  }
];
