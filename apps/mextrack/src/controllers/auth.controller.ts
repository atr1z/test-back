import { Request, Response } from 'express';
import { lucia, hashPassword, verifyPassword, type AuthRequest } from '@mextrack/auth';
import { sql } from '@mextrack/database';
import { successResponse, errorResponse, ValidationError, ConflictError } from '@mextrack/utils';
import { z } from 'zod';
import { nanoid } from 'nanoid';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function register(req: Request, res: Response) {
  try {
    const { email, password, name } = registerSchema.parse(req.body);

    // Check if user exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUser.length > 0) {
      throw new ConflictError('Email already registered');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);
    const userId = nanoid(15);

    // Create user
    await sql`
      INSERT INTO users (id, email, name, hashed_password, email_verified)
      VALUES (${userId}, ${email}, ${name}, ${hashedPassword}, false)
    `;

    // Create session
    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    res.cookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    return successResponse(
      res,
      {
        user: {
          id: userId,
          email,
          name,
        },
      },
      'User registered successfully',
      201
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(res, 'Validation error', 400, error.errors);
    }
    if (error instanceof ConflictError) {
      return errorResponse(res, error.message, error.statusCode);
    }
    return errorResponse(res, 'Registration failed', 500);
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user
    const users = await sql`
      SELECT id, email, name, hashed_password FROM users WHERE email = ${email}
    `;

    if (users.length === 0) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    const user = users[0];

    // Verify password
    const validPassword = await verifyPassword(user.hashed_password, password);

    if (!validPassword) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    // Create session
    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    res.cookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    return successResponse(res, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(res, 'Validation error', 400, error.errors);
    }
    return errorResponse(res, 'Login failed', 500);
  }
}

export async function logout(req: AuthRequest, res: Response) {
  try {
    if (!req.session) {
      return errorResponse(res, 'No active session', 401);
    }

    await lucia.invalidateSession(req.session.id);
    const sessionCookie = lucia.createBlankSessionCookie();

    res.cookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    return successResponse(res, null, 'Logged out successfully');
  } catch (error) {
    return errorResponse(res, 'Logout failed', 500);
  }
}

export async function getCurrentUser(req: AuthRequest, res: Response) {
  if (!req.user) {
    return errorResponse(res, 'Unauthorized', 401);
  }

  return successResponse(res, {
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
  });
}
