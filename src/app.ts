import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import apiRouter from './routes/index';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import http from 'http';
import cors from 'cors';
import { initDubikenStore } from './dubiken/store';

const app: Application = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
    credentials: true,
  }),
);

app.use(express.json());

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Dubiken API', version: '1.0', base: '/api/v1' });
});

app.use('/api/v1', apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    await initDubikenStore();
    console.log('Seed users: admin@dubiken.com / buyer@test.com (password: Dubiken123!)');
    server.listen(PORT, () => console.log(`Dubiken API running on http://localhost:${PORT}/api/v1`));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
