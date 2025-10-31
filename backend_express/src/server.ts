import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './db';
import { initializeVectorStore } from './services/vector-store.service';
import { errorHandler } from './middleware';
import authRoutes from './routes/auth';
import diariesRoutes from './routes/diaries';
import orbsRoutes from './routes/orbs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGINS || 'http://localhost:5173',
  credentials: true,
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/diaries', diariesRoutes);
app.use('/api/orbs', orbsRoutes);

// Error handling
app.use(errorHandler);

// Initialize and start
async function start() {
  try {
    // Log environment configuration
    console.log('\n========================================');
    console.log('🚀 Starting Heart Orb Diary Server');
    console.log('========================================');
    console.log(`📝 Node Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔧 Port: ${PORT}`);

    // Check API key configuration
    const apiKey = process.env.GOOGLE_API_KEY;
    if (apiKey && apiKey.length > 20) {
      console.log('✅ GOOGLE_API_KEY configured (Gemini AI enabled)');
    } else if (apiKey) {
      console.log('⚠️  GOOGLE_API_KEY appears invalid (too short)');
      console.log('   → AI features will use template responses');
    } else {
      console.log('⚠️  GOOGLE_API_KEY not configured');
      console.log('   → AI features will use template responses');
    }

    // Initialize database
    await initializeDatabase();
    console.log('✅ Database initialized');

    // Initialize vector store (embeddings API)
    await initializeVectorStore();

    app.listen(PORT, () => {
      console.log(`\n✨ Server running on http://localhost:${PORT}`);
      console.log('========================================\n');
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

start();
