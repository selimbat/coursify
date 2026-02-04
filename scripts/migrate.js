import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';
import pool from '../src/lib/db.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function runMigrations() {
    try {
        console.log('Connecting to PostgreSQL...');
        const client = await pool.connect();

        console.log('Running migrations...');
        const migrationsDir = resolve('migrations');
        const files = readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();

        for (const file of files) {
            const filePath = resolve(migrationsDir, file);
            const sql = readFileSync(filePath, 'utf-8');

            console.log(`✓ Running migration: ${file}`);
            await client.query(sql);
        }

        client.release();
        console.log('✓ All migrations completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('✗ Migration failed:', error);
        process.exit(1);
    }
}

runMigrations();
