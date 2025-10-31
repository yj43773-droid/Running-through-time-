import { db } from '../db';
import { User, AuthUser } from '../types';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

function getAsync<T>(sql: string, params: any[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T | undefined);
    });
  });
}

function runAsync(sql: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export async function getUser(id: string): Promise<User | null> {
  const user = await getAsync<User>('SELECT * FROM users WHERE id = ?', [id]);
  return user || null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const user = await getAsync<User>('SELECT * FROM users WHERE email = ?', [email]);
  return user || null;
}

export async function createUser(email: string, password: string, displayName?: string): Promise<User> {
  const id = uuidv4();
  const passwordHash = bcrypt.hashSync(password, 10);
  const createdAt = new Date().toISOString();

  await runAsync(
    'INSERT INTO users (id, email, passwordHash, displayName, createdAt) VALUES (?, ?, ?, ?, ?)',
    [id, email, passwordHash, displayName || null, createdAt]
  );

  return { id, email, displayName, passwordHash, createdAt };
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;

  const isValid = bcrypt.compareSync(password, user.passwordHash);
  return isValid ? user : null;
}

export function serializeAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
  };
}
