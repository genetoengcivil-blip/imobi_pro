import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("SUPABASE URL:", supabaseUrl);
console.log("SUPABASE KEY:", supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("ENV NÃO CARREGADA NO FRONT");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);