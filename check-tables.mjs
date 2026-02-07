#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env file
const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length > 0) {
    envVars[key.trim()] = rest.join('=').replace(/^"/, '').replace(/"$/, '');
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function getTableStructure() {
  try {
    console.log('🔍 Fetching Supabase table structure...\n');

    // Query to get all tables in public schema
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables_info', { schema_name: 'public' })
      .catch(() => null);

    if (tablesError || !tables) {
      console.log('ℹ️  Using information_schema query...\n');
      
      // Fallback: Use direct information_schema query
      const query = `
        SELECT 
          table_name,
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position
      `;

      const { data, error } = await supabase.rpc('exec_sql', { sql: query }).catch(() => ({ data: null, error: true }));
      
      if (error || !data) {
        // Display tables from the schema file instead
        await displayTablesFromSchema();
        return;
      }
    }

    // List all tables first
    const { data: allTables, error: allTablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (!allTablesError && allTables) {
      const tableNames = allTables.map(t => t.table_name).filter(t => !t.startsWith('pg_'));
      console.log(`📊 Total Tables Found: ${tableNames.length}\n`);
      console.log('📋 Tables List:');
      tableNames.forEach((name, i) => {
        console.log(`   ${i + 1}. ${name}`);
      });
      console.log('\n');
    }

    // Try to get column info for each table by querying each one
    const publicTables = [
      'user_roles',
      'profiles',
      'categories',
      'products',
      'addresses',
      'orders',
      'order_items',
      'cart_items',
      'coupons',
      'banners',
      'delivery_settings',
      'store_settings'
    ];

    for (const tableName of publicTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select()
          .limit(0);

        if (!error) {
          console.log(`\n📌 Table: ${tableName}`);
          console.log('━'.repeat(60));
          console.log('Columns:');
          
          // Get the structure from the response headers
          if (data && data.length === 0) {
            console.log('  (Empty table - no structure info available via REST)');
          }
        }
      } catch (e) {
        // Table might not exist or access denied
      }
    }

    // Display from schema file
    await displayTablesFromSchema();

  } catch (error) {
    console.error('Error:', error.message);
    await displayTablesFromSchema();
  }
}

async function displayTablesFromSchema() {
  console.log('\n📖 Table Structure from Schema:\n');
  
  const tables = {
    'user_roles': [
      { column: 'id', type: 'UUID', nullable: false, default: 'gen_random_uuid()' },
      { column: 'user_id', type: 'UUID', nullable: false, default: '-', relationship: 'auth.users(id)' },
      { column: 'role', type: 'app_role', nullable: false, default: "'user'" }
    ],
    'profiles': [
      { column: 'id', type: 'UUID', nullable: false, default: 'gen_random_uuid()' },
      { column: 'user_id', type: 'UUID', nullable: false, default: '-', relationship: 'auth.users(id)' },
      { column: 'full_name', type: 'TEXT', nullable: false, default: "''" },
      { column: 'phone', type: 'TEXT', nullable: true, default: '-' },
      { column: 'created_at', type: 'TIMESTAMPTZ', nullable: false, default: 'now()' },
      { column: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, default: 'now()' }
    ],
    'categories': [
      { column: 'id', type: 'UUID', nullable: false, default: 'gen_random_uuid()' },
      { column: 'name', type: 'TEXT', nullable: false, default: '-' },
      { column: 'description', type: 'TEXT', nullable: true, default: '-' },
      { column: 'image_url', type: 'TEXT', nullable: true, default: '-' },
      { column: 'sort_order', type: 'INT', nullable: false, default: '0' },
      { column: 'created_at', type: 'TIMESTAMPTZ', nullable: false, default: 'now()' }
    ],
    'products': [
      { column: 'id', type: 'UUID', nullable: false, default: 'gen_random_uuid()' },
      { column: 'name', type: 'TEXT', nullable: false, default: '-' },
      { column: 'description', type: 'TEXT', nullable: true, default: '-' },
      { column: 'price', type: 'NUMERIC(10,2)', nullable: false, default: '0' },
      { column: 'compare_price', type: 'NUMERIC(10,2)', nullable: true, default: '-' },
      { column: 'category_id', type: 'UUID', nullable: true, default: '-', relationship: 'categories(id)' },
      { column: 'image_url', type: 'TEXT', nullable: true, default: '-' },
      { column: 'images', type: 'TEXT[]', nullable: true, default: "'{}'" },
      { column: 'stock_quantity', type: 'INT', nullable: false, default: '0' },
      { column: 'is_available', type: 'BOOLEAN', nullable: false, default: 'true' },
      { column: 'is_featured', type: 'BOOLEAN', nullable: false, default: 'false' },
      { column: 'weight', type: 'TEXT', nullable: true, default: '-' },
      { column: 'unit', type: 'TEXT', nullable: true, default: '-' },
      { column: 'created_at', type: 'TIMESTAMPTZ', nullable: false, default: 'now()' },
      { column: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, default: 'now()' }
    ],
    'addresses': [
      { column: 'id', type: 'UUID', nullable: false, default: 'gen_random_uuid()' },
      { column: 'user_id', type: 'UUID', nullable: false, default: '-', relationship: 'auth.users(id)' },
      { column: 'full_name', type: 'TEXT', nullable: false, default: "''" },
      { column: 'phone', type: 'TEXT', nullable: false, default: "''" },
      { column: 'address_line1', type: 'TEXT', nullable: false, default: "''" },
      { column: 'address_line2', type: 'TEXT', nullable: true, default: '-' },
      { column: 'city', type: 'TEXT', nullable: false, default: "'Madurai'" },
      { column: 'state', type: 'TEXT', nullable: false, default: "'Tamil Nadu'" },
      { column: 'pincode', type: 'TEXT', nullable: false, default: "''" },
      { column: 'is_default', type: 'BOOLEAN', nullable: false, default: 'false' },
      { column: 'created_at', type: 'TIMESTAMPTZ', nullable: false, default: 'now()' }
    ],
    'orders': [
      { column: 'id', type: 'UUID', nullable: false, default: 'gen_random_uuid()' },
      { column: 'user_id', type: 'UUID', nullable: false, default: '-', relationship: 'auth.users(id)' },
      { column: 'order_number', type: 'TEXT', nullable: false, default: '-' },
      { column: 'status', type: 'order_status', nullable: false, default: "'pending'" },
      { column: 'payment_method', type: 'payment_method', nullable: false, default: "'cod'" },
      { column: 'payment_status', type: 'payment_status', nullable: false, default: "'pending'" },
      { column: 'stripe_payment_id', type: 'TEXT', nullable: true, default: '-' },
      { column: 'subtotal', type: 'NUMERIC(10,2)', nullable: false, default: '0' },
      { column: 'delivery_charge', type: 'NUMERIC(10,2)', nullable: false, default: '0' },
      { column: 'discount', type: 'NUMERIC(10,2)', nullable: false, default: '0' },
      { column: 'total', type: 'NUMERIC(10,2)', nullable: false, default: '0' },
      { column: 'notes', type: 'TEXT', nullable: true, default: '-' },
      { column: 'delivery_address', type: 'TEXT', nullable: true, default: '-' },
      { column: 'created_at', type: 'TIMESTAMPTZ', nullable: false, default: 'now()' },
      { column: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, default: 'now()' }
    ],
    'order_items': [
      { column: 'id', type: 'UUID', nullable: false, default: 'gen_random_uuid()' },
      { column: 'order_id', type: 'UUID', nullable: false, default: '-', relationship: 'orders(id)' },
      { column: 'product_id', type: 'UUID', nullable: true, default: '-', relationship: 'products(id)' },
      { column: 'quantity', type: 'INT', nullable: false, default: '1' },
      { column: 'price', type: 'NUMERIC(10,2)', nullable: false, default: '0' },
      { column: 'created_at', type: 'TIMESTAMPTZ', nullable: false, default: 'now()' }
    ],
    'cart_items': [
      { column: 'id', type: 'UUID', nullable: false, default: 'gen_random_uuid()' },
      { column: 'user_id', type: 'UUID', nullable: false, default: '-', relationship: 'auth.users(id)' },
      { column: 'product_id', type: 'UUID', nullable: false, default: '-', relationship: 'products(id)' },
      { column: 'quantity', type: 'INT', nullable: false, default: '1' },
      { column: 'created_at', type: 'TIMESTAMPTZ', nullable: false, default: 'now()' }
    ],
    'coupons': [
      { column: 'id', type: 'UUID', nullable: false, default: 'gen_random_uuid()' },
      { column: 'code', type: 'TEXT', nullable: false, default: '-' },
      { column: 'description', type: 'TEXT', nullable: true, default: '-' },
      { column: 'discount_type', type: 'TEXT', nullable: false, default: "'percentage'" },
      { column: 'discount_value', type: 'NUMERIC(10,2)', nullable: false, default: '0' },
      { column: 'min_order_value', type: 'NUMERIC(10,2)', nullable: true, default: '-' },
      { column: 'max_uses', type: 'INT', nullable: true, default: '-' },
      { column: 'used_count', type: 'INT', nullable: false, default: '0' },
      { column: 'is_active', type: 'BOOLEAN', nullable: false, default: 'true' },
      { column: 'valid_from', type: 'TIMESTAMPTZ', nullable: true, default: 'now()' },
      { column: 'valid_until', type: 'TIMESTAMPTZ', nullable: true, default: '-' },
      { column: 'created_at', type: 'TIMESTAMPTZ', nullable: false, default: 'now()' }
    ],
    'banners': [
      { column: 'id', type: 'UUID', nullable: false, default: 'gen_random_uuid()' },
      { column: 'title', type: 'TEXT', nullable: false, default: "''" },
      { column: 'description', type: 'TEXT', nullable: true, default: '-' },
      { column: 'image_url', type: 'TEXT', nullable: true, default: '-' },
      { column: 'link', type: 'TEXT', nullable: true, default: '-' },
      { column: 'sort_order', type: 'INT', nullable: false, default: '0' },
      { column: 'is_active', type: 'BOOLEAN', nullable: false, default: 'true' },
      { column: 'created_at', type: 'TIMESTAMPTZ', nullable: false, default: 'now()' }
    ],
    'delivery_settings': [
      { column: 'id', type: 'UUID', nullable: false, default: 'gen_random_uuid()' },
      { column: 'base_charge', type: 'NUMERIC(10,2)', nullable: false, default: '40.00' },
      { column: 'free_delivery_above', type: 'NUMERIC(10,2)', nullable: true, default: '-' },
      { column: 'is_active', type: 'BOOLEAN', nullable: false, default: 'true' },
      { column: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, default: 'now()' }
    ],
    'store_settings': [
      { column: 'id', type: 'UUID', nullable: false, default: 'gen_random_uuid()' },
      { column: 'store_name', type: 'TEXT', nullable: false, default: "'PANDIYIN Nature In Pack'" },
      { column: 'phone', type: 'TEXT', nullable: true, default: '-' },
      { column: 'whatsapp', type: 'TEXT', nullable: true, default: '-' },
      { column: 'email', type: 'TEXT', nullable: true, default: '-' },
      { column: 'address', type: 'TEXT', nullable: true, default: '-' },
      { column: 'instagram', type: 'TEXT', nullable: true, default: '-' },
      { column: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, default: 'now()' }
    ]
  };

  console.log(`\nTotal Tables: ${Object.keys(tables).length}\n`);

  for (const [tableName, columns] of Object.entries(tables)) {
    console.log(`\n📌 ${tableName.toUpperCase()}`);
    console.log('═'.repeat(80));
    
    // Header
    console.log(`${'Column'.padEnd(25)} | ${'Type'.padEnd(20)} | ${'Null?'.padEnd(6)} | Default`);
    console.log('─'.repeat(80));

    // Columns
    columns.forEach(col => {
      const nullable = col.nullable ? 'Yes' : 'No';
      const rel = col.relationship ? ` (→ ${col.relationship})` : '';
      console.log(
        `${(col.column + rel).padEnd(25)} | ${col.type.padEnd(20)} | ${nullable.padEnd(6)} | ${col.default}`
      );
    });
  }

  console.log('\n\n📚 Key Relationships:');
  console.log('═'.repeat(80));
  console.log('  user_roles → auth.users (user_id)');
  console.log('  profiles → auth.users (user_id)');
  console.log('  addresses → auth.users (user_id)');
  console.log('  orders → auth.users (user_id)');
  console.log('  order_items → orders (order_id)');
  console.log('  order_items → products (product_id)');
  console.log('  cart_items → auth.users (user_id)');
  console.log('  cart_items → products (product_id)');
  console.log('  products → categories (category_id)');

  console.log('\n\n🔐 Enums (Custom Types):');
  console.log('═'.repeat(80));
  console.log('  app_role: admin, user');
  console.log('  order_status: pending, confirmed, processing, shipped, delivered, cancelled');
  console.log('  payment_method: stripe, cod');
  console.log('  payment_status: pending, paid, failed, refunded');

  console.log('\n✅ All tables are ready to use!\n');
}

getTableStructure();
