import express          from 'express';
import { createServer } from 'http';
import { Server }       from 'socket.io';
import cors             from 'cors';
import helmet           from 'helmet';
import rateLimit        from 'express-rate-limit';
import dotenv from 'dotenv';
import path   from 'path';

// Carga el .env — busca en el directorio donde se ejecuta el comando
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import { connectDatabase, initSchema } from './config/database';
import { setupGameGateway }            from './socket/game.gateway';
import scoresRouter                    from './routes/scores.routes';
import playersRouter                   from './routes/Players.routes';

dotenv.config();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost';

const app        = express();
const httpServer = createServer(app);

// ── Seguridad ────────────────────────────────────────────────────────────────

// Headers de seguridad HTTP
app.use(helmet({
  crossOriginEmbedderPolicy: false,  // necesario para Socket.IO
  contentSecurityPolicy: false       // el frontend maneja su propio CSP
}));

// CORS estricto — solo permite el origen del frontend
/*app.use(cors({
  origin: (origin, callback) => {
    // Permite requests sin origin (ej: Postman, curl) solo en desarrollo
    if (!origin && process.env.NODE_ENV !== 'production') return callback(null, true);
    if (origin === FRONTEND_URL) return callback(null, true);
    callback(new Error('CORS: origen no permitido'));
  },
  methods: ['GET', 'POST'],
  credentials: true
}));*/

const allowedOrigins = [
  'http://localhost:4200',
  'http://127.0.0.1:4200'
];

app.use(cors({
  origin: (origin, callback) => {

    console.log('Origin recibido:', origin);

    // Permitir requests sin origin (Postman, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS bloqueado para: ${origin}`));
  },
  methods: ['GET', 'POST'],
  credentials: true
}));

// Rate limiting — máximo 100 requests por IP cada 15 minutos
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,
  message:  { success: false, message: 'Demasiadas solicitudes, intenta más tarde' },
  standardHeaders: true,
  legacyHeaders:   false
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10kb' })); // limita el tamaño del body

// ── Socket.IO ────────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin:  FRONTEND_URL,
    methods: ['GET', 'POST']
  }
});

// ── Rutas ────────────────────────────────────────────────────────────────────
app.use('/api/scores',  scoresRouter);
app.use('/api/players', playersRouter);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Manejo de rutas no encontradas
app.use((_req, res) => res.status(404).json({ success: false, message: 'Ruta no encontrada' }));

// Manejo global de errores (no expone stack traces)
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ success: false, message: 'Error interno del servidor' });
});

setupGameGateway(io);

// ── Inicio ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

const start = async () => {
  await connectDatabase();
  await initSchema();
  httpServer.listen(PORT, () =>
    console.log(`🚀 Backend corriendo en http://localhost:${PORT}`)
  );
};

start().catch(err => {
  console.error('Error iniciando servidor:', err);
  process.exit(1);
});
