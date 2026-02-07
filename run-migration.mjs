import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const projectId = 'adgihdeigquuoozmvfai';
const publishableKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkZ2loZGVpZ3F1dW9vem12ZmFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NjIzMjMsImV4cCI6MjA4NjAzODMyM30.yC3TI8UFXGTAm0Da-QGfQ9sBhTKFCgF7JyCYn0lDBD4';
const supabaseUrl = 'https://adgihdeigquuoozmvfai.supabase.co';

const supabase = createClient(supabaseUrl, publishableKey);

// Read and apply migration
const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20260207140000_add_instagram_to_store_settings.sql');
const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

async function runMigration() {
  try {
    // Since we're using the anon key, we can't directly execute SQL
    // Instead, we'll use the Supabase REST API or direct SQL execution
    // For now, we'll use RPC calls to update the table structure
    
    console.log('Running migration...');
    console.log('SQL:', migrationSql);
    
    // Note: Direct SQL execution requires a service role key in production
    // For development, you may need to execute this in the Supabase dashboard
    console.log('\nTo apply this migration, please run the following SQL in your Supabase dashboard:');
    console.log('---');
    console.log(migrationSql);
    console.log('---');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

runMigration();
