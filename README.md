# Correr o Morir 🏃

Juego de carrera urbana para 2 jugadores en el mismo PC. Recoge frutos, esquiva autos y trampas. Gana quien tenga más puntos en 3 minutos.

## Stack

- **Frontend**: Angular 21 + Phaser 4
- **Backend**: Node.js + Express + Socket.IO
- **Base de datos**: PostgreSQL 16

## Levantar con Docker (recomendado)

```bash
# 1. Clonar el repositorio
git clone https://github.com/jorge-l-g-p/correr-o-morir.git
cd correr-o-morir

# 2. Copiar variables de entorno
cp .env.example .env

# 3. Levantar todo
docker compose up -d

# 4. Abrir en el navegador
# http://localhost
```

## Levantar en desarrollo local

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (otra terminal)
cd frontend
npm install
ng serve
```

Abre `http://localhost:4200`

## Imágenes Docker Hub

```bash
docker pull jorluis/correr-o-morir-backend:latest
docker pull jorluis/correr-o-morir-frontend:latest
```

## Controles

| Jugador | Moverse |
|---------|---------|
| J1      | WASD    |
| J2      | Flechas |

## Mecánicas

- 🍎 **Frutos** — restauran vitalidad y dan puntos
- ⚠️ **Trampas neón** — restan vitalidad
- 🚗 **Autos** — restan vitalidad al chocar
- ❤️ **Vitalidad baja** — el jugador se mueve más lento
- ⏱ **3 minutos** — gana quien tenga más puntos al acabar el tiempo
