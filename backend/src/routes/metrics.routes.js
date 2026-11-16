import { Router } from 'express';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

router.get('/', (req, res) => {
  const meals = db.prepare(`
    SELECT is_on_diet, date_time FROM meals
    WHERE user_id = ? ORDER BY date_time ASC, id ASC
  `).all(req.userId);

  const total = meals.length;
  const onDiet = meals.filter(meal => meal.is_on_diet === 1).length;
  const offDiet = total - onDiet;

  let currentStreak = 0;
  let bestStreak = 0;
  for (const meal of meals) {
    if (meal.is_on_diet === 1) {
      currentStreak += 1;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return res.json({
    metrics: {
      totalMeals: total,
      mealsOnDiet: onDiet,
      mealsOffDiet: offDiet,
      bestOnDietSequence: bestStreak
    }
  });
});

export default router;
