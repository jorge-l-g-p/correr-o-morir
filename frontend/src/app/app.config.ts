/**
 * Configuración principal de la aplicación Angular.
 * Registra: router, HttpClient, error listeners globales.
 */
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners
} from '@angular/core';
import { provideRouter }         from '@angular/router';
import { provideHttpClient }     from '@angular/common/http';
import { routes }                from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient()
  ]
};
