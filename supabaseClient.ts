import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kbeisgurcyfziuntmeug.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiZWlzZ3VyY3lmeml1bnRtZXVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4ODQ2NjYsImV4cCI6MjA3ODQ2MDY2Nn0.0Nn-pSL360E-BFzVYBvtUQtyNBlotdSecRz4oHis1K4';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables SUPABASE_URL and SUPABASE_ANON_KEY are required.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);