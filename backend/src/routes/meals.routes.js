import { Router } from 'express';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

function validateMeal(body) {
  const { name, description, dateTime, isOnDiet } = body ?? {};
  if (!name?.trim() || typeof description !== 'string' ||
      !dateTime || Number.isNaN(Date.parse(dateTime)) ||
      typeof isOnDiet !== 'boolean') {
    return 'Informe nome, descrição, data/hora válida e situação da dieta.';
  }
  return null;
}

function formatMeal(row) {
  return { ...row, isOnDiet: Boolean(row.is_on_diet), dateTime: row.date_time,
    is_on_diet: undefined, date_time: undefined, user_id: undefined };
}

router.post('/', (req, res) => {
  const error = validateMeal(req.body);
  if (error) return res.status(400).json({ error });

  const { name, description, dateTime, isOnDiet } = req.body;
  const result = db.prepare(`
    INSERT INTO meals (user_id, name, description, date_time, is_on_diet)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.userId, name.trim(), description.trim(), dateTime, isOnDiet ? 1 : 0);

  const meal = db.prepare('SELECT * FROM meals WHERE id = ? AND user_id = ?')
    .get(result.lastInsertRowid, req.userId);
  return res.status(201).json({ meal: formatMeal(meal) });
});

router.get('/', (req, res) => {
  const meals = db.prepare(`
    SELECT * FROM meals WHERE user_id = ? ORDER BY date_time DESC, id DESC
  `).all(req.userId).map(formatMeal);
  return res.json({ meals });
});

router.get('/:id', (req, res) => {
  const meal = db.prepare('SELECT * FROM meals WHERE id = ? AND user_id = ?')
    .get(Number(req.params.id), req.userId);
  if (!meal) return res.status(404).json({ error: 'Refeição não encontrada.' });
  return res.json({ meal: formatMeal(meal) });
});

router.put('/:id', (req, res) => {
  const error = validateMeal(req.body);
  if (error) return res.status(400).json({ error });

  const id = Number(req.params.id);
  const existing = db.prepare('SELECT id FROM meals WHERE id = ? AND user_id = ?')
    .get(id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Refeição não encontrada.' });

  const { name, description, dateTime, isOnDiet } = req.body;
  db.prepare(`
    UPDATE meals SET name = ?, description = ?, date_time = ?, is_on_diet = ?
    WHERE id = ? AND user_id = ?
  `).run(name.trim(), description.trim(), dateTime, isOnDiet ? 1 : 0, id, req.userId);

  const meal = db.prepare('SELECT * FROM meals WHERE id = ? AND user_id = ?').get(id, req.userId);
  return res.json({ meal: formatMeal(meal) });
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM meals WHERE id = ? AND user_id = ?')
    .run(Number(req.params.id), req.userId);
  if (!result.changes) return res.status(404).json({ error: 'Refeição não encontrada.' });
  return res.status(204).send();
});

export default router;
