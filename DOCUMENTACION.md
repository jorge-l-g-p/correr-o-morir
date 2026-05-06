# CORRER O MORIR
## Documentación Técnica del Proyecto

---

## 1. DESCRIPCIÓN GENERAL

**Correr o Morir** es un videojuego multijugador local para 2 jugadores en el mismo PC. Los jugadores compiten en una ciudad generada proceduralmente, recogiendo frutos para ganar puntos y esquivando obstáculos como autos, trampas y zonas de smog. Gana quien tenga más puntos al terminar el tiempo de 3 minutos.

### Características principales
- 2 jugadores en la misma pantalla
- Ciudad con edificios, calles, autos en movimiento y semáforos
- Sistema de vitalidad: la vitalidad baja con obstáculos y sube con frutos
- Velocidad proporcional a la vitalidad (menos vida = más lento)
- Minimapa para cada jugador
- Pantalla de resultados con trofeo al ganador
- Base de datos para guardar puntuaciones
- Dockerizado y publicado en Docker Hub

---

## 2. TECNOLOGÍAS UTILIZADAS

### Frontend
| Tecnología | Versión | Para qué se usa |
|-----------|---------|----------------|
| Angular | 21 | Framework principal de la aplicación web |
| Phaser | 4.1 | Motor de videojuegos 2D (gráficos, física, animaciones) |
| TypeScript | 5.9 | Lenguaje de programación tipado |
| RxJS | 7.8 | Programación reactiva (manejo de eventos y estado) |
| Socket.IO Client | 4.8 | Comunicación en tiempo real con el servidor |
| SCSS | - | Estilos CSS avanzados |

### Backend
| Tecnología | Versión | Para qué se usa |
|-----------|---------|----------------|
| Node.js | 22 | Entorno de ejecución JavaScript del servidor |
| Express | 5.2 | Framework web para crear la API REST |
| Socket.IO | 4.8 | Servidor de comunicación en tiempo real |
| TypeScript | 5.8 | Lenguaje tipado para el backend |
| pg (node-postgres) | 8.13 | Driver para conectarse a PostgreSQL |
| Helmet | 8.0 | Headers de seguridad HTTP |
| express-rate-limit | 7.5 | Límite de peticiones por IP |

### Base de datos
| Tecnología | Versión | Para qué se usa |
|-----------|---------|----------------|
| PostgreSQL | 16 | Base de datos relacional para guardar jugadores y puntuaciones |

### Infraestructura
| Tecnología | Para qué se usa |
|-----------|----------------|
| Docker | Contenedores para empaquetar cada servicio |
| Docker Compose | Orquestar los 3 servicios juntos |
| Nginx | Servidor web para el frontend en producción |
| GitHub Actions | CI/CD automático (build y push a Docker Hub) |
| Docker Hub | Registro de imágenes Docker públicas |

---

## 3. ARQUITECTURA DEL SISTEMA

```
┌─────────────────────────────────────────────────────┐
│                    NAVEGADOR                         │
│                                                      │
│  ┌──────────────┐    ┌──────────────────────────┐   │
│  │   Angular    │    │        Phaser 4           │   │
│  │   (HUD,      │◄──►│   (Ciudad, Jugadores,     │   │
│  │   Menús,     │    │    Autos, Colisiones)      │   │
│  │   Resultados)│    └──────────────────────────┘   │
│  └──────┬───────┘                                    │
└─────────┼───────────────────────────────────────────┘
          │ HTTP / WebSocket
          ▼
┌─────────────────────────────────────────────────────┐
│                   BACKEND (Node.js)                  │
│                                                      │
│  ┌──────────────┐    ┌──────────────────────────┐   │
│  │  Express API │    │      Socket.IO            │   │
│  │  REST        │    │   (Eventos en tiempo      │   │
│  │  /api/scores │    │    real del juego)         │   │
│  │  /api/players│    └──────────────────────────┘   │
│  └──────┬───────┘                                    │
└─────────┼───────────────────────────────────────────┘
          │ SQL
          ▼
┌─────────────────────────────────────────────────────┐
│                  PostgreSQL                          │
│   Tablas: players, game_sessions, session_players    │
└─────────────────────────────────────────────────────┘
```

---

## 4. ESTRUCTURA DE ARCHIVOS

```
correr-o-morir/
│
├── frontend/                          # Aplicación Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/
│   │   │   │   ├── interfaces/        # Tipos TypeScript
│   │   │   │   │   ├── player.interface.ts
│   │   │   │   │   ├── collectible.interface.ts
│   │   │   │   │   └── game-state.interface.ts
│   │   │   │   ├── services/
│   │   │   │   │   ├── game-state.service.ts  # Estado global con RxJS
│   │   │   │   │   └── socket.service.ts      # Wrapper Socket.IO
│   │   │   │   └── constants/
│   │   │   │       └── characters.ts          # Personajes disponibles
│   │   │   │
│   │   │   └── features/
│   │   │       ├── player-selection/          # Pantalla de inicio
│   │   │       ├── game/
│   │   │       │   ├── engine/
│   │   │       │   │   ├── scenes/
│   │   │       │   │   │   ├── preload.scene.ts  # Carga de assets
│   │   │       │   │   │   └── game.scene.ts     # Escena principal
│   │   │       │   │   ├── entities/
│   │   │       │   │   │   ├── player.entity.ts
│   │   │       │   │   │   └── collectible.entity.ts
│   │   │       │   │   └── game-engine.component.ts
│   │   │       │   └── hud/                   # Barras de vitalidad
│   │   │       └── leaderboard/               # Top 10 jugadores
│   │   └── environments/
│   │       ├── environment.ts                 # Desarrollo
│   │       └── environment.prod.ts            # Producción
│   ├── Dockerfile
│   └── nginx.conf
│
├── backend/                           # Servidor Node.js
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts            # Conexión PostgreSQL
│   │   ├── models/
│   │   │   ├── Player.models.ts       # Operaciones de jugadores
│   │   │   └── GameSession.model.ts   # Operaciones de sesiones
│   │   ├── routes/
│   │   │   ├── Players.routes.ts      # GET/POST /api/players
│   │   │   └── scores.routes.ts       # GET /api/scores/leaderboard
│   │   ├── services/
│   │   │   ├── GameRoom.service.ts    # Salas de juego en memoria
│   │   │   └── Score.service.ts       # Lógica de puntuaciones
│   │   ├── socket/
│   │   │   └── game.gateway.ts        # Eventos Socket.IO
│   │   └── server.ts                  # Punto de entrada
│   └── Dockerfile
│
├── docker-compose.yml                 # Orquestación de servicios
├── .env.example                       # Plantilla de variables de entorno
├── .github/
│   └── workflows/
│       └── build-push.yml             # CI/CD GitHub Actions
└── README.md
```

---

## 5. BASE DE DATOS

### Diagrama de tablas

```
┌─────────────────┐       ┌──────────────────┐       ┌──────────────────────┐
│    players      │       │  game_sessions   │       │   session_players    │
├─────────────────┤       ├──────────────────┤       ├──────────────────────┤
│ id (PK)         │       │ id (PK)          │       │ id (PK)              │
│ username        │       │ room_id          │       │ session_id (FK)      │
│ character_id    │       │ duration         │       │ player_id (FK)       │
│ high_score      │       │ completed_at     │       │ username             │
│ total_games     │       └──────────────────┘       │ final_vitality       │
│ created_at      │                                   │ score                │
└─────────────────┘                                   │ winner               │
                                                      └──────────────────────┘
```

### Descripción de tablas

**players** — Almacena los jugadores registrados
- `id`: Identificador único autoincremental
- `username`: Nombre del jugador (único, máx 50 caracteres)
- `character_id`: Personaje elegido (runner, survivor, guardian)
- `high_score`: Puntuación más alta histórica
- `total_games`: Total de partidas jugadas

**game_sessions** — Registra cada partida jugada
- `room_id`: Identificador de la sala de juego
- `duration`: Duración de la partida en segundos

**session_players** — Resultados de cada jugador por partida
- `final_vitality`: Vitalidad al terminar la partida
- `score`: Puntos obtenidos
- `winner`: Si ganó o no

---

## 6. MECÁNICAS DEL JUEGO

### Controles
| Jugador | Arriba | Abajo | Izquierda | Derecha |
|---------|--------|-------|-----------|---------|
| Jugador 1 | W | S | A | D |
| Jugador 2 | ↑ | ↓ | ← | → |

### Sistema de vitalidad
- Cada jugador empieza con **100% de vitalidad**
- La vitalidad **baja** cuando el jugador está quieto (desgaste pasivo)
- La vitalidad **baja** al chocar con un auto (-20%)
- La vitalidad **baja** al tocar una trampa neón (-15 a -30%)
- La vitalidad **sube** al recoger frutos (+10 a +25%)
- La vitalidad **nunca llega a 0** — mínimo 1%
- **Velocidad proporcional**: a 100% vas rápido, a 1% vas muy lento

### Coleccionables
| Tipo | Color | Efecto |
|------|-------|--------|
| Manzana | Rojo orgánico | +15% vitalidad, +10 pts |
| Naranja | Naranja | +20% vitalidad, +10 pts |
| Mora | Morado | +10% vitalidad, +10 pts |
| Melón | Verde | +25% vitalidad, +10 pts |
| Trampa neón verde | Verde brillante | -15 a -20% vitalidad |
| Trampa neón rosa | Fucsia | -15% vitalidad |
| Trampa neón amarilla | Amarillo | -25% vitalidad |

### Condición de victoria
- La partida dura **3 minutos** (180 segundos)
- Al terminar el tiempo, **gana quien tenga más puntos**
- En caso de empate, se declara **empate**

---

## 7. COMUNICACIÓN EN TIEMPO REAL (SOCKET.IO)

### Eventos del cliente al servidor
| Evento | Datos | Descripción |
|--------|-------|-------------|
| `game:join` | username, characterId | Jugador solicita unirse |
| `game:ready` | roomId | Jugador confirma que está listo |
| `game:player_update` | roomId, position, vitality, score | Actualización de estado cada frame |
| `game:end` | roomId, duration, players | Notifica fin de partida |

### Eventos del servidor al cliente
| Evento | Datos | Descripción |
|--------|-------|-------------|
| `game:joined` | roomId, socketId | Confirmación de unión a sala |
| `game:player_joined` | socketId, username | Otro jugador se unió |
| `game:start_countdown` | countdown | Inicia cuenta regresiva |
| `game:start` | - | La partida comienza |
| `game:opponent_update` | position, vitality, score | Estado del oponente |
| `game:results` | players | Resultados finales |
| `game:opponent_disconnected` | - | El oponente se desconectó |

---

## 8. API REST

### Endpoints disponibles

**GET /health**
- Verifica que el servidor está funcionando
- Respuesta: `{ "status": "ok" }`

**POST /api/players**
- Registra un nuevo jugador
- Body: `{ "username": "string", "characterId": "string" }`
- Respuesta: `{ "success": true, "data": { jugador } }`

**GET /api/players/:id**
- Obtiene datos de un jugador por ID
- Respuesta: `{ "success": true, "data": { jugador } }`

**GET /api/scores/leaderboard**
- Retorna el top 10 de jugadores por puntuación
- Respuesta: `{ "success": true, "data": [ jugadores ] }`

---

## 9. SEGURIDAD IMPLEMENTADA

| Medida | Descripción |
|--------|-------------|
| Helmet.js | Agrega headers HTTP de seguridad automáticamente |
| Rate Limiting | Máximo 100 peticiones por IP cada 15 minutos |
| Validación de inputs | Todos los datos entrantes son validados antes de procesarse |
| CORS estricto | Solo acepta peticiones del frontend autorizado |
| Sin credenciales en código | Las contraseñas vienen de variables de entorno |
| Headers Nginx | X-Frame-Options, X-Content-Type-Options, X-XSS-Protection |
| Puerto DB interno | PostgreSQL solo accesible desde localhost |
| Mensajes de error genéricos | No expone detalles internos al cliente |

---

## 10. DOCKER Y DESPLIEGUE

### Servicios en Docker Compose

```
docker-compose.yml
│
├── db (PostgreSQL 16)
│   └── Datos persistentes en volumen pgdata
│
├── backend (Node.js 22)
│   └── Depende de db (espera que esté healthy)
│
└── frontend (Nginx + Angular)
    └── Depende de backend
```

### Cómo levantar el proyecto

**Opción 1 — Desde Docker Hub (sin código fuente)**
```bash
# 1. Descargar el docker-compose
curl -O https://raw.githubusercontent.com/jorge-l-g-p/correr-o-morir/main/docker-compose.yml

# 2. Crear archivo .env
echo "DB_PASSWORD=mi_clave_segura" > .env

# 3. Levantar
docker compose up -d

# 4. Abrir en el navegador
# http://localhost
```

**Opción 2 — Desde el código fuente**
```bash
git clone https://github.com/jorge-l-g-p/correr-o-morir.git
cd correr-o-morir
cp .env.example .env
# Editar .env con tu contraseña
docker compose up -d --build
```

### Imágenes en Docker Hub
- `jorluis/correr-o-morir-frontend:latest`
- `jorluis/correr-o-morir-backend:latest`

---

## 11. CI/CD CON GITHUB ACTIONS

### Flujo automático

```
Developer hace push a main
         │
         ▼
GitHub Actions se activa
         │
         ├── Build imagen Backend
         │   └── npm ci → tsc → imagen Node.js
         │
         ├── Build imagen Frontend
         │   └── npm ci → ng build → imagen Nginx
         │
         └── Push a Docker Hub
             ├── jorluis/correr-o-morir-backend:latest
             ├── jorluis/correr-o-morir-backend:{commit-sha}
             ├── jorluis/correr-o-morir-frontend:latest
             └── jorluis/correr-o-morir-frontend:{commit-sha}
```

### Configuración necesaria
- Secret `DOCKER_HUB_TOKEN` en GitHub → Settings → Secrets

---

## 12. PATRONES Y CONCEPTOS APLICADOS

### Patrones de diseño
| Patrón | Dónde se usa |
|--------|-------------|
| Singleton | GameStateService (una sola instancia global) |
| Observer | RxJS BehaviorSubject para el estado del juego |
| Bridge | PhaserBridge conecta Phaser con Angular |
| Repository | PlayerModel y GameSessionModel abstraen la BD |
| Gateway | game.gateway.ts centraliza todos los eventos Socket.IO |

### Conceptos de programación aplicados
- **Programación reactiva** — RxJS para manejar eventos asíncronos
- **Arquitectura en capas** — Separación entre rutas, servicios y modelos
- **Inyección de dependencias** — Angular DI para servicios
- **Tipado estático** — TypeScript en frontend y backend
- **Transacciones de BD** — Para guardar sesiones de forma atómica
- **Pool de conexiones** — Reutilización eficiente de conexiones a PostgreSQL

---

## 13. REPOSITORIOS

| Recurso | URL |
|---------|-----|
| Código fuente | https://github.com/jorge-l-g-p/correr-o-morir |
| Imagen Backend | https://hub.docker.com/r/jorluis/correr-o-morir-backend |
| Imagen Frontend | https://hub.docker.com/r/jorluis/correr-o-morir-frontend |

---

*Documento generado para el proyecto Correr o Morir — 2026*
