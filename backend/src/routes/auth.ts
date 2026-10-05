import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';

const router = Router();

// Helper: check if a passport strategy is registered
function hasStrategy(name: string): boolean {
  try {
    // passport._strategy() throws if not found
    return !!(passport as any)._strategy(name);
  } catch {
    return false;
  }
}

// Middleware that returns 501 if the strategy isn't configured
function requireStrategy(strategyName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!hasStrategy(strategyName)) {
      return res.status(501).json({
        error: `${strategyName} OAuth is not configured. Add real credentials to your .env file.`,
      });
    }
    next();
  };
}

// ── Google OAuth Initiation ───────────────────────────────────────────────────
router.get(
  '/google',
  requireStrategy('google'),
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
  })
);

// ── Google OAuth Callback ─────────────────────────────────────────────────────
router.get(
  '/google/callback',
  requireStrategy('google'),
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`,
  }),
  (req, res) => {
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`);
  }
);

// ── GitHub OAuth Initiation ───────────────────────────────────────────────────
router.get(
  '/github',
  requireStrategy('github'),
  passport.authenticate('github', {
    scope: ['user:email'],
  })
);

// ── GitHub OAuth Callback ─────────────────────────────────────────────────────
router.get(
  '/github/callback',
  requireStrategy('github'),
  passport.authenticate('github', {
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`,
  }),
  (req, res) => {
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`);
  }
);

// ── Get Current User ──────────────────────────────────────────────────────────
router.get('/me', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const user = req.user as any;
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    slackConnected: !!user.slackToken,
  });
});

// ── Logout ────────────────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  });
});

export default router;
