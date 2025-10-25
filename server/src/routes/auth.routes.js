import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.model.js';
import { signJwt } from '../utils/jwt.js';
import { requireAuth } from '../middleware/auth.js'; // <-- CRITICAL IMPORT ADDED

const router = Router();

// --- CRITICAL FIX: Dynamic Cookie Setting ---
function setCookie(res, token) {
  // Check environment: NODE_ENV is set to 'production' on Render
  const isProduction = process.env.NODE_ENV === 'production';
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

  res.cookie('token', token, {
    httpOnly: true,
    // MUST be true and 'none' for Vercel (HTTPS) -> Render (cross-site) communication
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax', 
    maxAge,
  });
}

/**
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role });

    // Login immediately after registration
    const token = signJwt({ sub: user._id, role: user.role });
    setCookie(res, token);
    
    res.status(201).json({ message: 'Registration successful', user: { id: user._id, name: user.name, role: user.role } });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Email already exists' });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});


/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = signJwt({ sub: user._id, role: user.role });
  setCookie(res, token);
  
  res.json({ message: 'Login successful', user: { id: user._id, name: user.name, role: user.role } });
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  // Clear the cookie
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Use same dynamic check
    path: '/',
  });
  res.json({ message: 'Logged out' });
});

/**
 * GET /api/auth/me (used by frontend to verify login status)
 */
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: { id: req.user.sub, name: req.user.name, role: req.user.role } });
});


export default router;