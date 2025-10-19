import { Lucia } from 'lucia';
import { PostgresJsAdapter } from '@lucia-auth/adapter-postgresql';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const sql = postgres(connectionString);

const adapter = new PostgresJsAdapter(sql, {
  user: 'users',
  session: 'sessions',
});

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === 'production',
    },
  },
  getUserAttributes: (attributes) => {
    return {
      email: attributes.email,
      name: attributes.name,
      emailVerified: attributes.email_verified,
    };
  },
});

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

interface DatabaseUserAttributes {
  email: string;
  name: string;
  email_verified: boolean;
}

export type { User, Session } from 'lucia';
