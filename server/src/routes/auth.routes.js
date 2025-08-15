import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.model.js';
import { signJwt } from '../utils/jwt.js';
import { requireAuth } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();
const AuthSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['teacher','student'])
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = AuthSchema.parse(req.body);
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already in use' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role });
    const token = signJwt({ sub: user._id.toString(), role: user.role, name: user.name, email: user.email });
    setCookie(res, token);
    res.status(201).json({ user: safeUser(user) });
  } catch (e) {
    res.status(400).json({ message: e?.message || 'Bad request' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Missing email/password' });
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
  const token = signJwt({ sub: user._id.toString(), role: user.role, name: user.name, email: user.email });
  setCookie(res, token);
  res.json({ user: safeUser(user) });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', cookieClearOptions());
  res.json({ ok: true });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.sub).select('-passwordHash');
  res.json({ user });
});

// helpers
function safeUser(u) {
  const { _id, name, email, role, createdAt } = u;
  return { id: _id, name, email, role, createdAt };
}
function setCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7,
    path: '/'
  });
}
function cookieClearOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  };
}

export default router;
