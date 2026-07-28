import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yeuxqnacnrmxydjmqula.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlldXhxbmFjbnJteHlkam1xdWxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNjA0NTYsImV4cCI6MjEwMDczNjQ1Nn0.SJBz5rRlCOWplBQBY67UsBCRsxA0p34SE0FtbtVEmWM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
