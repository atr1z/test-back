import { Request, Response, NextFunction } from 'express';
import { lucia } from './lucia';
import type { User, Session } from 'lucia';

export interface AuthRequest extends Request {
  user?: User;
  session?: Session;
}

/**
 * Middleware to validate session and attach user to request
 * Returns 401 if session is invalid
 */
export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const sessionId = req.cookies.auth_session;

  if (!sessionId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { session, user } = await lucia.validateSession(sessionId);

  if (!session) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return;
  }

  // Refresh session if it's fresh (close to expiry)
  if (session.fresh) {
    const sessionCookie = lucia.createSessionCookie(session.id);
    res.cookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
  }

  req.user = user;
  req.session = session;
  next();
}

/**
 * Optional auth middleware - attaches user if session exists
 * Does not return 401 if session is missing
 */
export async function optionalAuthMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const sessionId = req.cookies.auth_session;

  if (!sessionId) {
    req.user = undefined;
    req.session = undefined;
    next();
    return;
  }

  const { session, user } = await lucia.validateSession(sessionId);

  if (session?.fresh) {
    const sessionCookie = lucia.createSessionCookie(session.id);
    res.cookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
  }

  req.user = user;
  req.session = session;
  next();
}
