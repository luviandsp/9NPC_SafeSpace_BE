import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY!;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be defined in environment variables',
  );
}

// 1. GLOBAL CLIENT: Matikan persistSession agar aman dari kebocoran sesi di backend
export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

// 2. SCOPED CLIENT: Gunakan ini HANYA untuk operasi yang butuh RLS (Storage/Database user)
export const createScopedClient = (token: string) => {
  return createClient(supabaseUrl, supabasePublishableKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
    },
  });
};

export default supabase;
