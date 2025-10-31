import { db } from '../db';
import { MemoryOrb } from '../types';
import { v4 as uuidv4 } from 'uuid';

function getAsync<T>(sql: string, params: any[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T | undefined);
    });
  });
}

function allAsync<T>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve((rows || []) as T[]);
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

export async function getOrb(id: string): Promise<MemoryOrb | null> {
  const orb = await getAsync<MemoryOrb>(
    'SELECT * FROM memory_orbs WHERE id = ?',
    [id]
  );
  return orb ? deserializeOrb(orb) : null;
}

export async function listOrbsForUser(userId: string): Promise<MemoryOrb[]> {
  const orbs = await allAsync<MemoryOrb>(
    'SELECT * FROM memory_orbs WHERE userId = ? ORDER BY date DESC',
    [userId]
  );
  return orbs.map(deserializeOrb);
}

export async function createOrb(
  userId: string,
  diaryId: string,
  emotion: string,
  date: string,
  reinterpretationNote?: string
): Promise<MemoryOrb> {
  const id = uuidv4();
  const createdAt = new Date().toISOString();
  const updatedAt = createdAt;

  await runAsync(
    `INSERT INTO memory_orbs (
      id, userId, diaryId, emotion, date, isReinterpreted,
      reinterpretationNote, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)`,
    [id, userId, diaryId, emotion, date, reinterpretationNote || null, createdAt, updatedAt]
  );

  const orb = await getOrb(id);
  if (!orb) throw new Error('Failed to create memory orb');
  return orb;
}

export async function updateOrb(id: string, updates: Partial<MemoryOrb>): Promise<MemoryOrb> {
  const fields: string[] = [];
  const values: any[] = [];

  const allowedFields = [
    'reinterpretationNote',
    'reinterpretationReplies',
    'isReinterpreted',
  ];

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      fields.push(`${key} = ?`);
      if (typeof value === 'object' && value !== null) {
        values.push(JSON.stringify(value));
      } else {
        values.push(value);
      }
    }
  }

  fields.push('updatedAt = ?');
  values.push(new Date().toISOString());

  if (fields.length <= 1) {
    const orb = await getOrb(id);
    if (!orb) throw new Error('Memory orb not found');
    return orb;
  }

  values.push(id);
  await runAsync(`UPDATE memory_orbs SET ${fields.join(', ')} WHERE id = ?`, values);

  const orb = await getOrb(id);
  if (!orb) throw new Error('Failed to update memory orb');
  return orb;
}

export async function serializeOrb(orb: MemoryOrb): Promise<any> {
  return {
    id: orb.id,
    userId: orb.userId,
    diaryId: orb.diaryId,
    emotion: orb.emotion,
    date: orb.date,
    isReinterpreted: Boolean(orb.isReinterpreted),
    reinterpretationNote: orb.reinterpretationNote,
    reinterpretationReplies: orb.reinterpretationReplies,
    createdAt: orb.createdAt,
    updatedAt: orb.updatedAt,
  };
}

function deserializeOrb(orb: any): MemoryOrb {
  return {
    ...orb,
    isReinterpreted: Boolean(orb.isReinterpreted),
    reinterpretationReplies: orb.reinterpretationReplies
      ? JSON.parse(orb.reinterpretationReplies)
      : undefined,
  };
}
