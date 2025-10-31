import { db } from '../db';
import { Diary } from '../types';
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

export async function getDiary(id: string): Promise<Diary | null> {
  const diary = await getAsync<Diary>(
    'SELECT * FROM diaries WHERE id = ?',
    [id]
  );
  return diary ? deserializeDiary(diary) : null;
}

export async function listDiaries(
  userId: string,
  limit: number = 20,
  offset: number = 0,
  emotion?: string,
  isEvolved?: boolean
): Promise<Diary[]> {
  let sql = 'SELECT * FROM diaries WHERE userId = ?';
  const params: any[] = [userId];

  if (emotion) {
    sql += ' AND emotion = ?';
    params.push(emotion);
  }

  if (isEvolved !== undefined) {
    sql += ' AND isEvolved = ?';
    params.push(isEvolved ? 1 : 0);
  }

  sql += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const diaries = await allAsync<Diary>(sql, params);
  return diaries.map(deserializeDiary);
}

export async function createDiary(
  userId: string,
  text: string,
  emotion: string,
  aiCharacter: string = 'HeartOrb Companion',
  aiResponse: string = ''
): Promise<Diary> {
  const id = uuidv4();
  const createdAt = new Date().toISOString();

  await runAsync(
    `INSERT INTO diaries (
      id, userId, text, createdAt, emotion, aiCharacter, aiResponse, isEvolved
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    [id, userId, text, createdAt, emotion, aiCharacter, aiResponse]
  );

  const diary = await getDiary(id);
  if (!diary) throw new Error('Failed to create diary');
  return diary;
}

export async function updateDiary(id: string, updates: Partial<Diary>): Promise<Diary> {
  const fields: string[] = [];
  const values: any[] = [];

  const allowedFields = [
    'text', 'emotion', 'aiCharacter', 'aiResponse', 'isEvolved',
    'reinterpretation', 'evolvedEmotion', 'aiPersonaResponses',
    'similarDiaryRefs', 'emotionColor', 'evolvedEmotionColor', 'linkedPastDiaryId'
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

  if (fields.length === 0) {
    const diary = await getDiary(id);
    if (!diary) throw new Error('Diary not found');
    return diary;
  }

  values.push(id);
  await runAsync(`UPDATE diaries SET ${fields.join(', ')} WHERE id = ?`, values);

  const diary = await getDiary(id);
  if (!diary) throw new Error('Failed to update diary');
  return diary;
}

export async function deleteDiary(id: string): Promise<void> {
  await runAsync('DELETE FROM diaries WHERE id = ?', [id]);
}

export async function serializeDiary(diary: Diary): Promise<any> {
  return {
    id: diary.id,
    userId: diary.userId,
    text: diary.text,
    content: diary.text,
    createdAt: diary.createdAt,
    updatedAt: diary.createdAt,
    date: diary.createdAt,
    emotion: diary.emotion,
    aiCharacter: diary.aiCharacter,
    aiResponse: diary.aiResponse,
    isEvolved: Boolean(diary.isEvolved),
    reinterpretation: diary.reinterpretation,
    evolvedEmotion: diary.evolvedEmotion,
    emotionColor: diary.emotionColor,
    evolvedEmotionColor: diary.evolvedEmotionColor,
    linkedPastDiaryId: diary.linkedPastDiaryId,
    aiPersonaResponses: diary.aiPersonaResponses,
    similarDiaries: diary.similarDiaryRefs,
  };
}

function deserializeDiary(diary: any): Diary {
  return {
    ...diary,
    isEvolved: Boolean(diary.isEvolved),
    aiPersonaResponses: diary.aiPersonaResponses ? JSON.parse(diary.aiPersonaResponses) : undefined,
    similarDiaryRefs: diary.similarDiaryRefs ? JSON.parse(diary.similarDiaryRefs) : undefined,
  };
}
