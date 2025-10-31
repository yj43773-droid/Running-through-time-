import { db, initializeDatabase } from './db';
import * as userService from './services/user.service';

async function seed() {
  try {
    console.log('🌱 Seeding database...');

    // Initialize tables
    await initializeDatabase();
    console.log('✅ Database initialized');

    // Create test users
    const testUsers = [
      {
        email: 'test@example.com',
        password: 'password123',
        displayName: '테스트 사용자',
      },
      {
        email: 'user@example.com',
        password: 'password123',
        displayName: '사용자 1',
      },
      {
        email: 'demo@example.com',
        password: 'demo123',
        displayName: '데모 사용자',
      },
    ];

    for (const userData of testUsers) {
      try {
        const user = await userService.createUser(
          userData.email,
          userData.password,
          userData.displayName
        );
        console.log(`✅ Created user: ${user.email}`);
      } catch (err: any) {
        if (err.message?.includes('UNIQUE constraint failed')) {
          console.log(`⚠️  User already exists: ${userData.email}`);
        } else {
          throw err;
        }
      }
    }

    console.log('\n✨ Seeding complete!');
    console.log('\n📝 Test Accounts:');
    console.log('─────────────────────────────────');
    testUsers.forEach(user => {
      console.log(`📧 Email: ${user.email}`);
      console.log(`🔑 Password: ${user.password}`);
      console.log('─────────────────────────────────');
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
