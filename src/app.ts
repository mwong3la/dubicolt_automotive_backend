import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import apiRouter from './routes/index';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import http from 'http';
import cors from 'cors';
import { initDubicoltStore } from './dubicolt/store';
import { setupSwagger } from './lib/swagger';

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
  res.json({ message: 'Dubicolt Automotive API', version: '1.0', base: '/api', docs: '/api/docs' });
});

setupSwagger(app);

app.use('/api', apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    await initDubicoltStore();
    console.log('Seed users: admin@dubicolt.com / buyer@test.com (password: Dubicolt123!)');
    server.listen(PORT, () => {
      console.log(`Dubicolt Automotive API running on http://localhost:${PORT}/api`);
      console.log(`Swagger docs: http://localhost:${PORT}/api/docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
