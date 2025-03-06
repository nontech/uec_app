// supabaseClient.ts - Supabase client with ANON key
// This client should be used for public-facing operations with RLS policies

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
 * Creates a Supabase client using the ANON key
 * This client respects Row Level Security (RLS) policies
 * @param req - The incoming request (to pass auth headers)
 * @returns Supabase client
 */
export const createSupabaseClient = (req: Request) => {
  return createClient(
    // Supabase API URL - env var exported by default
    Deno.env.get('SUPABASE_URL') ?? '',
    // Supabase ANON KEY - env var exported by default
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    // Create client with Auth context of the user that called the function
    // This way your row-level-security (RLS) policies are applied
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization') ?? '' },
      },
    }
  );
};

export default createSupabaseClient;
