import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// Trimming to avoid any hidden characters from manual entry
const rawUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bspntiubfypzbcblmoey.supabase.co';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzcG50aXViZnlwemJjYmxtb2V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MTUyNDksImV4cCI6MjA5Njk5MTI0OX0.RtKQJYBft0LeeEGAb_9jUDLJqSzTvGOGPtQxsSQjOR8';

const supabaseUrl = rawUrl.trim().replace(/\/rest\/v1\/?$/, ''); // Remove trailing /rest/v1 if present
const supabaseKey = rawKey.trim();

export const supabase = createClient(supabaseUrl, supabaseKey);
