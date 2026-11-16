import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import mealsRoutes from './routes/meals.routes.js';
import metricsRoutes from './routes/metrics.routes.js';
import './database.js';

if (!process.env.JWT_SECRET) {
  throw new Error('Defina JWT_SECRET no arquivo .env antes de iniciar a API.');
}

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok', message: 'Daily Diet API funcionando.' }));
app.use('/api/auth', authRoutes);
app.use('/api/meals', mealsRoutes);
app.use('/api/metrics', metricsRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

const port = Number(process.env.PORT || 3333);
app.listen(port, () => console.log(`Daily Diet API disponível em http://localhost:${port}`));
