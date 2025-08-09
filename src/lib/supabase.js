import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wyijpwoyskwrbgazwspp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5aWpwd295c2t3cmJnYXp3c3BwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NDkyODQsImV4cCI6MjA3MDEyNTI4NH0.VumtxlEXegD8JqqsAxcZgDA1_TLojuc4lOCR_2KlBq0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);