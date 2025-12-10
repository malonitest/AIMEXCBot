/**
 * Database Initialization Script
 * 
 * This script initializes the database with a default test user
 * Run with: node scripts/init-db.js
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function initDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  });

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    // Check if user already exists
    const userCheck = await client.query('SELECT * FROM users WHERE username = $1', ['testuser']);
    
    if (userCheck.rows.length === 0) {
      console.log('Creating default test user...');
      const hashedPassword = await bcrypt.hash('testpass123', 10);
      
      await client.query(
        'INSERT INTO users (username, password_hash) VALUES ($1, $2)',
        ['testuser', hashedPassword]
      );
      
      console.log('✓ Default user created (username: testuser, password: testpass123)');
    } else {
      console.log('✓ Test user already exists');
    }
    
    client.release();
    console.log('✓ Database initialization complete');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDatabase();
