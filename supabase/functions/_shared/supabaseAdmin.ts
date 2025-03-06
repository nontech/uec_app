// supabaseAdmin.ts - Supabase client with SERVICE_ROLE key
// This client bypasses Row Level Security (RLS) and should be used with caution
// Only use for admin operations that require elevated privileges

// For JSR imports in TypeScript, we need to use the @ts-ignore comment
// @ts-ignore
import { createClient } from 'jsr:@supabase/supabase-js@2';

// TypeScript declaration for Deno environment
declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
};

/**
 * Creates a Supabase admin client using the SERVICE_ROLE key
 * This client bypasses Row Level Security (RLS) policies
 * CAUTION: Only use for admin operations that require elevated privileges
 * @returns Supabase admin client
 */
export const createSupabaseAdmin = () => {
  return createClient(
    // Supabase API URL - env var exported by default
    Deno.env.get('SUPABASE_URL') ?? '',
    // Supabase SERVICE_ROLE KEY - env var exported by default
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      // Optional: Set auth to use service role headers globally
      global: {
        headers: {
          // Using service role bypasses RLS
          Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
      },
    }
  );
};

export default createSupabaseAdmin;
