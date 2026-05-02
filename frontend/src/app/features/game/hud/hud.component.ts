import { Component, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { toSignal }       from '@angular/core/rxjs-interop';
import { GameStateService } from '../../../core/services/game-state.service';

@Component({
  selector:    'app-hud',
  standalone:  true,
  imports:     [CommonModule],
  templateUrl: './hud.component.html',
  styleUrl:    './hud.component.scss'
})
export class HudComponent implements OnInit, OnDestroy {

  private readonly gameState = inject(GameStateService);
  readonly state = toSignal(this.gameState.state$);

  // Tick cada 100ms para refrescar datos de J2 desde window
  private tick = signal(0);
  private intervalId: any;

  ngOnInit(): void {
    this.intervalId = setInterval(() => this.tick.set(Date.now()), 100);
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }

  // J1 — del GameStateService
  readonly j1Vitality = computed(() => this.state()?.localPlayer?.vitality ?? 100);
  readonly j1Score    = computed(() => this.state()?.localPlayer?.score    ?? 0);
  readonly j1Name     = computed(() => this.state()?.localPlayer?.username ?? 'Jugador 1');

  // J2 — de window.__p2State, se refresca con el tick
  readonly j2Vitality = computed(() => { this.tick(); return (window as any).__p2State?.vitality ?? 100; });
  readonly j2Score    = computed(() => { this.tick(); return (window as any).__p2State?.score    ?? 0;   });
  readonly j2Name     = computed(() => { this.tick(); return (window as any).__p2State?.username ?? 'Jugador 2'; });

  readonly j1VitalityColor = computed(() => this.vitalityColor(this.j1Vitality()));
  readonly j2VitalityColor = computed(() => this.vitalityColor(this.j2Vitality()));

  readonly timeDisplay = computed(() => {
    const secs = this.state()?.gameDuration ?? 0;
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  });

  private vitalityColor(v: number): string {
    if (v > 60) return '#4caf50';
    if (v > 30) return '#ff9800';
    return '#f44336';
  }
}
