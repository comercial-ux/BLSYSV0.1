import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eqooygwoyitqeiqtynoq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxb295Z3dveWl0cWVpcXR5bm9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMDczMTEsImV4cCI6MjA3MDU4MzMxMX0.ybZby7qGef3szAUCm9z-CsDXoClOu6dp1VKZgQaqGgw';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
