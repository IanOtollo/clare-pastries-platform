
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fduoacyykjsqpmraajua.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkdW9hY3l5a2pzcXBtcmFhanVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NzYwNjksImV4cCI6MjA5MTM1MjA2OX0.EiFQjivDLfjVqiSrMFNAUpI8v5YblUNydlj1bJDQL1Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSchema() {
  console.log('--- Order Table ---');
  const { data, error } = await supabase.from('Order').select('*').limit(1);
  if (error) {
    console.error('Error fetching Order:', error.message);
  } else if (data && data.length > 0) {
    console.log('Columns:', Object.keys(data[0]).join(', '));
  } else {
    console.log('No rows in Order table.');
  }

  console.log('\n--- OrderItem Table ---');
  const { data: itemData, error: itemError } = await supabase.from('OrderItem').select('*').limit(1);
  if (itemError) {
    console.error('Error fetching OrderItem:', itemError.message);
  } else if (itemData && itemData.length > 0) {
    console.log('Columns:', Object.keys(itemData[0]).join(', '));
  } else {
    console.log('No rows in OrderItem table.');
  }
}

testSchema();
