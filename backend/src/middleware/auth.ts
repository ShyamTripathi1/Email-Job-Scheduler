import { Request, Response, NextFunction } from 'express';

/**
 * Express middleware that blocks unauthenticated requests.
 * Returns 401 JSON for API routes (used by all /api/* routes except /api/auth).
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized — please sign in with Google' });
}
