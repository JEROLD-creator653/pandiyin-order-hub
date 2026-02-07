#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const newUrl = process.argv[2];
const newKey = process.argv[3];

if (!newUrl || !newKey) {
  console.error('❌ Usage: node import-data.mjs <new-supabase-url> <new-supabase-key>');
  console.error('Example: node import-data.mjs https://xxxx.supabase.co eyJhbG...');
  process.exit(1);
}

const supabase = createClient(newUrl, newKey);

async function importData() {
  try {
    console.log('🔄 Importing data to new Supabase project...\n');

    const rawData = fs.readFileSync(path.join(__dirname, 'supabase-export.json'), 'utf-8');
    const exportedData = JSON.parse(rawData);

    for (const [table, records] of Object.entries(exportedData)) {
      if (records.length === 0) {
        console.log(`⏭️  ${table}: No data to import`);
        continue;
      }

      console.log(`📥 Importing ${records.length} records into ${table}...`);

      const { error } = await supabase
        .from(table)
        .insert(records, { count: 'estimated' });

      if (error) {
        console.error(`❌ Error importing ${table}:`, error.message);
      } else {
        console.log(`✅ ${table}: Imported successfully`);
      }
    }

    console.log('\n✅ Data import complete!');
    console.log('\n📝 Update your .env file with:');
    console.log(`VITE_SUPABASE_URL="${newUrl}"`);
    console.log(`VITE_SUPABASE_PUBLISHABLE_KEY="${newKey}"`);

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

importData();
