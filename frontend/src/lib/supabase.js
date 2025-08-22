import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qzvnfjgpdnayrhdgfizl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6dm5mamdwZG5heXJoZGdmaXpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MzMxODUsImV4cCI6MjA3MTQwOTE4NX0.Q3H-LCllFErjRtc6MbBvDygGy7jSm9b6crElKnAJaF8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;