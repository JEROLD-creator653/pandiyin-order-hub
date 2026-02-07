#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length > 0) {
    envVars[key.trim()] = rest.join('=').replace(/^"/, '').replace(/"$/, '');
  }
});

// Current Supabase credentials (Lovable AI project)
const currentUrl = envVars.VITE_SUPABASE_URL || 'https://adgihdeigquuoozmvfai.supabase.co';
const currentKey = envVars.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(currentUrl, currentKey);

async function exportData() {
  try {
    console.log('🔄 Exporting data from Lovable AI Supabase project...\n');

    // List of tables to export
    const tables = [
      'store_settings',
      'delivery_settings',
      'categories',
      'products',
      'coupons',
      'banners'
    ];

    const exportedData = {};

    for (const table of tables) {
      console.log(`📦 Exporting ${table}...`);
      const { data, error } = await supabase
        .from(table)
        .select('*');

      if (error) {
        console.error(`❌ Error exporting ${table}:`, error.message);
        continue;
      }

      exportedData[table] = data || [];
      console.log(`✅ ${table}: ${(data || []).length} records`);
    }

    // Save to file
    fs.writeFileSync(
      path.join(__dirname, 'supabase-export.json'),
      JSON.stringify(exportedData, null, 2)
    );

    console.log('\n✅ Data exported to supabase-export.json');
    console.log('\n📋 Next steps:');
    console.log('1. Create a new Supabase project in your account');
    console.log('2. Run the SQL migrations in the SQL Editor');
    console.log('3. Update your .env file with new credentials');
    console.log('4. Run: node import-data.mjs <new-project-url> <new-project-key>');

  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
}

exportData();
