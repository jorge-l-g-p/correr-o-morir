/**
 * LeaderboardComponent — top 10 jugadores.
 * Consume el endpoint REST GET /api/scores/leaderboard.
 */
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule }               from '@angular/common';
import { HttpClient }                 from '@angular/common/http';
import { RouterLink }                 from '@angular/router';
import { environment }                from '../../../environments/environment';
import { IPlayer }                    from '../../core/interfaces/player.interface';

@Component({
  selector:    'app-leaderboard',
  standalone:  true,
  imports:     [CommonModule, RouterLink],
  templateUrl: './leaderboard.component.html',
  styleUrl:    './leaderboard.component.scss'
})
export class LeaderboardComponent implements OnInit {

  players  = signal<IPlayer[]>([]);
  loading  = signal(true);
  errorMsg = signal('');

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<{ success: boolean; data: IPlayer[] }>(
      `${environment.apiUrl}/api/scores/leaderboard`
    ).subscribe({
      next:  res => { this.players.set(res.data); this.loading.set(false); },
      error: ()  => { this.errorMsg.set('No se pudo cargar el leaderboard'); this.loading.set(false); }
    });
  }

  /** Medalla según posición */
  medal(index: number): string {
    return ['🥇', '🥈', '🥉'][index] ?? `${index + 1}.`;
  }
}
