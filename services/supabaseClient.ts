import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bplxdneixxbuzybwnteg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwbHhkbmVpeHhidXp5YndudGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1ODQyNTYsImV4cCI6MjA4MDE2MDI1Nn0.HRmwet9xqRhvEqlmGGSbgisFxv-RyWJDY7W2FpYYwr4';

export const supabase = createClient(supabaseUrl, supabaseKey);