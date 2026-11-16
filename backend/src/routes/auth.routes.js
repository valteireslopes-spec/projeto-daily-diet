import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

function createToken(user) {
  return jwt.sign({ name: user.name }, process.env.JWT_SECRET, {
    subject: String(user.id),
    expiresIn: '7d'
  });
}

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body ?? {};
  if (!name?.trim() || !email?.trim() || !password || password.length < 6) {
    return res.status(400).json({ error: 'Informe nome, e-mail e senha com pelo menos 6 caracteres.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail)) {
    return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = db.prepare(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)'
    ).run(name.trim(), normalizedEmail, passwordHash);

    const user = { id: Number(result.lastInsertRowid), name: name.trim(), email: normalizedEmail };
    return res.status(201).json({ user, token: createToken(user) });
  } catch {
    return res.status(500).json({ error: 'Não foi possível criar a conta.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Informe e-mail e senha.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?')
    .get(String(email).trim().toLowerCase());

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
  }

  const safeUser = { id: user.id, name: user.name, email: user.email };
  return res.json({ user: safeUser, token: createToken(safeUser) });
});

router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
  return res.json({ user });
});

export default router;
