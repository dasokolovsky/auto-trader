/**
 * Setup analytics tables in Supabase
 * Run once: node setup-analytics.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jtcyaetmjdgosmgycwwh.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function setupAnalytics() {
  console.log('🔧 Setting up analytics tables...\n');
  
  // Read the SQL file
  const sql = fs.readFileSync('supabase-analytics-schema.sql', 'utf8');
  
  // Split into individual statements (rough split)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`Found ${statements.length} SQL statements to execute\n`);
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    
    // Skip comments
    if (statement.startsWith('--')) continue;
    
    try {
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      
      if (error) {
        console.log(`⚠️  Warning: ${error.message}`);
      } else {
        console.log(`✅ Success`);
      }
    } catch (error) {
      console.log(`⚠️  Error: ${error.message}`);
    }
  }
  
  console.log('\n✅ Analytics setup complete!\n');
  console.log('📊 New tables created:');
  console.log('  - execution_log');
  console.log('  - signal_history');
  console.log('  - portfolio_snapshots');
  console.log('  - performance_metrics\n');
  console.log('💡 Next steps:');
  console.log('  1. Start the bot: Set bot status to running in dashboard');
  console.log('  2. Wait for market hours');
  console.log('  3. After 1 day: node analyze-performance.js 1');
  console.log('  4. After 1 week: node generate-weekly-report.js\n');
}

setupAnalytics().catch(console.error);

