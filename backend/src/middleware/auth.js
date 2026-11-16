import jwt from 'jsonwebtoken';

export function authenticateToken(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token de autenticação não informado.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = Number(payload.sub);
    return next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}
