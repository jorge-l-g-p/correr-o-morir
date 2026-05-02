import express          from 'express';
import { createServer } from 'http';
import { Server }       from 'socket.io';
import cors             from 'cors';
import dotenv           from 'dotenv';
import { connectDatabase, initSchema } from './config/database';
import { setupGameGateway }            from './socket/game.gateway';
import scoresRouter                    from './routes/scores.routes';
import playersRouter                   from './routes/Players.routes';

dotenv.config();

const app        = express();
const httpServer = createServer(app);
const io         = new Server(httpServer, {
  cors: {
    origin:  process.env.FRONTEND_URL || 'http://localhost:4200',
    methods: ['GET', 'POST']
  }
});

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:4200' }));
app.use(express.json());

app.use('/api/scores',  scoresRouter);
app.use('/api/players', playersRouter);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

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
