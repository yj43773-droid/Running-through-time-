import dotenv from 'dotenv';
import { OpenAIEmbeddings } from '@langchain/openai';
import sqlite3 from 'sqlite3';
import { promisify } from 'util';

dotenv.config();

const db = new sqlite3.Database('./database.db');
const dbAll = promisify(db.all.bind(db));
const dbRun = promisify(db.run.bind(db));

interface Diary {
  id: string;
  text: string;
  embedding: Buffer | null;
}

async function migrate() {
  console.log('\n========================================');
  console.log('🚀 Starting Embedding Migration');
  console.log('========================================\n');

  // Validate API key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.length < 20) {
    console.error('❌ OPENAI_API_KEY not configured or invalid');
    process.exit(1);
  }

  try {
    // Initialize OpenAI embeddings
    console.log('📝 Initializing OpenAI Embeddings...');
    const embeddings = new OpenAIEmbeddings({
      apiKey,
      model: 'text-embedding-3-small',
    });
    console.log('✅ OpenAI initialized\n');

    // Get all diaries without embeddings
    console.log('📊 Querying diaries without embeddings...');
    const diaries = await new Promise<Diary[]>((resolve, reject) => {
      db.all(
        'SELECT id, text, embedding FROM diaries WHERE embedding IS NULL ORDER BY createdAt ASC',
        (err: Error | null, rows: any[]) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    console.log(`Found ${diaries.length} diaries without embeddings\n`);

    if (diaries.length === 0) {
      console.log('ℹ️  No diaries need embedding migration');
      process.exit(0);
    }

    // Process diaries sequentially
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < diaries.length; i++) {
      const diary = diaries[i];
      const progress = `[${i + 1}/${diaries.length}]`;

      try {
        console.log(`${progress} Generating embedding for diary ${diary.id}...`);

        // Generate embedding
        const embedding = await embeddings.embedQuery(diary.text);

        // Convert to buffer
        const embeddingBuffer = Buffer.from(JSON.stringify(embedding));

        // Store in database
        await new Promise<void>((resolve, reject) => {
          db.run(
            'UPDATE diaries SET embedding = ? WHERE id = ?',
            [embeddingBuffer, diary.id],
            (err: Error | null) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });

        console.log(`${progress} ✅ Embedding stored (${embedding.length} dimensions)`);
        successCount++;

        // Wait 500ms before next request to avoid rate limits
        if (i < diaries.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (err) {
        console.error(`${progress} ❌ Error: ${err instanceof Error ? err.message : String(err)}`);
        errorCount++;

        // Continue with next diary even if this one fails
        if (i < diaries.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }

    // Verify results
    console.log('\n📊 Verifying migration results...');
    const verification = await new Promise<{ total: number; withEmbeddings: number }>(
      (resolve, reject) => {
        db.get(
          `SELECT
            COUNT(*) as total,
            SUM(CASE WHEN embedding IS NOT NULL THEN 1 ELSE 0 END) as withEmbeddings
           FROM diaries`,
          (err: Error | null, row: any) => {
            if (err) reject(err);
            else resolve(row || { total: 0, withEmbeddings: 0 });
          }
        );
      }
    );

    console.log('========================================');
    console.log('✨ Migration Complete!');
    console.log('========================================');
    console.log(`✅ Successfully migrated: ${successCount} diaries`);
    console.log(`❌ Failed: ${errorCount} diaries`);
    console.log(`📊 Total diaries in database: ${verification.total}`);
    console.log(`💾 Total with embeddings: ${verification.withEmbeddings}`);
    console.log(`📈 Coverage: ${((verification.withEmbeddings / verification.total) * 100).toFixed(1)}%`);
    console.log('========================================\n');

    if (errorCount === 0) {
      console.log('🎉 All diaries successfully migrated!');
    } else {
      console.log(`⚠️  ${errorCount} diaries failed. Please retry or check logs.`);
      process.exit(1);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
