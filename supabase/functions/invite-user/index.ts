import { corsHeaders } from '../_shared/cors.ts';
// @ts-ignore: allow Deno types
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// @ts-ignore: allow Deno types
const supabaseUrl = Deno.env.get('DB_URL')!;
// @ts-ignore: allow Deno types
const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log(`Function "invite-user" up and running!`);

// @ts-ignore: allow Deno types
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, first_name, last_name, type, company_id, membership_id } =
      await req.json();

    // Validate required fields
    if (!email || !first_name) {
      throw new Error('Email and first name are required');
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('app_users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Invite user through auth system
    const { data: authUser, error: authError } =
      await supabase.auth.admin.inviteUserByEmail(email, {
        data: {
          first_name,
          last_name,
        },
        // @ts-ignore: allow Deno types
        redirectTo: `${Deno.env.get('SITE_URL')}`,
      });

    if (authError) throw authError;

    // Create user in app_users table
    const { error: appUserError } = await supabase.from('app_users').insert({
      id: authUser.user.id,
      email,
      first_name,
      last_name,
      type: type || 'employee',
      company_id,
      membership_id,
      status: 'active',
    });

    if (appUserError) throw appUserError;

    return new Response(
      JSON.stringify({ message: 'User invited successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:44321/functions/v1/invite-user' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
