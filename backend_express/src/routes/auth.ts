import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware';
import * as userService from '../services/user.service';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, displayName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = await userService.createUser(email, password, name || displayName);
    const tokens = issueTokens(user);

    return res.status(201).json({
      user: userService.serializeAuthUser(user),
      ...tokens,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await userService.authenticateUser(email, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const tokens = issueTokens(user);

    return res.json({
      user: userService.serializeAuthUser(user),
      ...tokens,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/refresh', (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing refresh token' });
    }

    const refreshToken = authHeader.substring(7);
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { sub: string; email: string };

    const accessToken = jwt.sign(
      { sub: payload.sub, email: payload.email },
      JWT_SECRET,
      { expiresIn: '30m' }
    );

    return res.json({ accessToken });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.get('/me', authenticate, (req: Request, res: Response) => {
  return res.json({
    user: req.user,
  });
});

function issueTokens(user: any) {
  const accessToken = jwt.sign(
    { sub: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '30m' }
  );

  const refreshToken = jwt.sign(
    { sub: user.id, email: user.email },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
}

export default router;
