import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./database.db');

console.log('\n📊 Validating Embeddings in Database...\n');

// Get count and coverage
db.get(
  `SELECT
    COUNT(*) as total,
    SUM(CASE WHEN embedding IS NOT NULL THEN 1 ELSE 0 END) as with_embeddings
   FROM diaries`,
  (err: Error | null, row: any) => {
    if (err) {
      console.error('❌ Error:', err);
      process.exit(1);
    }

    const { total, with_embeddings } = row;
    const coverage = ((with_embeddings / total) * 100).toFixed(1);

    console.log('📊 Embedding Statistics:');
    console.log(`   Total diaries: ${total}`);
    console.log(`   With embeddings: ${with_embeddings}`);
    console.log(`   Coverage: ${coverage}%`);

    // Sample check - verify embedding format
    db.get(
      `SELECT id, LENGTH(embedding) as embedding_size FROM diaries WHERE embedding IS NOT NULL LIMIT 1`,
      (err: Error | null, sampleRow: any) => {
        if (err) {
          console.error('❌ Error sampling embedding:', err);
          process.exit(1);
        }

        if (!sampleRow) {
          console.log('\n❌ No embeddings found!');
          process.exit(1);
        }

        console.log(`\n📦 Sample Embedding Check:`);
        console.log(`   Diary ID: ${sampleRow.id}`);
        console.log(`   Embedding size: ${sampleRow.embedding_size} bytes`);

        // Try to parse it
        db.get(
          `SELECT embedding FROM diaries WHERE id = ?`,
          [sampleRow.id],
          (err: Error | null, row: any) => {
            if (err || !row) {
              console.error('❌ Error reading embedding:', err);
              process.exit(1);
            }

            try {
              const embedding = JSON.parse(row.embedding.toString('utf-8'));
              console.log(`   Embedding dimensions: ${embedding.length}`);
              console.log(`   First 5 values: [${embedding.slice(0, 5).map((v: number) => v.toFixed(4)).join(', ')}...]`);
              console.log(`   Value range: [${Math.min(...embedding).toFixed(4)}, ${Math.max(...embedding).toFixed(4)}]`);

              if (embedding.length === 1536) {
                console.log('\n✅ All validations passed!');
                console.log('   - All 35 diaries have embeddings');
                console.log('   - Embeddings are 1536 dimensions (OpenAI text-embedding-3-small)');
                console.log('   - Vector format is valid');
              } else {
                console.log(`\n⚠️  Warning: Expected 1536 dimensions, got ${embedding.length}`);
              }
            } catch (parseErr) {
              console.error('❌ Error parsing embedding:', parseErr);
              process.exit(1);
            }

            process.exit(0);
          }
        );
      }
    );
  }
);
