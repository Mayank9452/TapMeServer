// src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project URL and anon key
const supabaseUrl = 'https://wlaaewesqdtlgzoaohpp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsYWFld2VzcWR0bGd6b2FvaHBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ1MTM1NzYsImV4cCI6MjA0MDA4OTU3Nn0.J_JkK_bcAKJjpDHv56EoI--q72cilWDeTdRJF4OcxhU';

export const supabase = createClient(supabaseUrl, supabaseKey);
