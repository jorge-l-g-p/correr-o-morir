import express          from 'express';
import { createServer } from 'http';
import { Server }       from 'socket.io';
import cors             from 'cors';
import helmet           from 'helmet';
import rateLimit        from 'express-rate-limit';
import dotenv           from 'dotenv';
import path             from 'path';

// Carga el .env desde la carpeta donde se ejecuta el comando
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { connectDatabase, initSchema } from './config/database';
import { setupGameGateway }            from './socket/game.gateway';
import scoresRouter                    from './routes/scores.routes';
import playersRouter                   from './routes/Players.routes';

const app        = express();
const httpServer = createServer(app);

// Origenes permitidos — acepta localhost con y sin puerto
const ALLOWED_ORIGINS = [
  'http://localhost',
  'http://localhost:4200',
  'http://localhost:80',
  'http://127.0.0.1',
  'http://127.0.0.1:4200',
  process.env.FRONTEND_URL || 'http://localhost'
].filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Sin origin = Postman, curl, o mismo servidor
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    console.error(`CORS bloqueado: ${origin}`);
    callback(new Error('CORS: origen no permitido'));
  },
  methods: ['GET', 'POST'],
  credentials: true
};

// Headers de seguridad
app.use(helmet({ crossOriginEmbedderPolicy: false, contentSecurityPolicy: false }));
app.use(cors(corsOptions));

// Rate limiting
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,
  message:  { success: false, message: 'Demasiadas solicitudes, intenta más tarde' },
  standardHeaders: true,
  legacyHeaders:   false
}));

app.use(express.json({ limit: '10kb' }));

// Socket.IO — acepta los mismos origenes
const io = new Server(httpServer, {
  cors: { origin: ALLOWED_ORIGINS, methods: ['GET', 'POST'] }
});

// Rutas
app.use('/api/scores',  scoresRouter);
app.use('/api/players', playersRouter);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// 404
app.use((_req, res) => res.status(404).json({ success: false, message: 'Ruta no encontrada' }));

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ success: false, message: 'Error interno del servidor' });
});

setupGameGateway(io);

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
