// Test context endpoint
// Run with: node test-context.js

const fs = require('fs');
const path = require('path');

// Read database to get a diary ID
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./database.db');

db.all('SELECT id FROM diaries LIMIT 1', async (err, rows) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.error('No diaries found in database');
    process.exit(1);
  }

  const diaryId = rows[0].id;
  console.log(`Testing with diary ID: ${diaryId}`);

  // Make API request
  try {
    // First, get auth token (you'll need to add one from your .env or test user)
    const response = await fetch(`http://localhost:5000/api/diaries/${diaryId}/reinterpret/context`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // You may need to update this
      },
      cache: 'no-store'
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Request error:', err);
  } finally {
    db.close();
  }
});
