/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:44321/functions/v1/invite-user' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/

import { corsHeaders } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseAdmin.ts';

console.log(`Function "invite-user" up and running!`);

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Use the shared admin client instead of creating one directly
    const supabase = createSupabaseAdmin();

    const {
      email,
      first_name,
      last_name,
      type,
      company_id,
      membership_id,
      meals_per_week,
    } = await req.json();

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

    // Fetch company name and membership details
    const [{ data: companyData }, { data: membershipData }] = await Promise.all(
      [
        supabase.from('companies').select('name').eq('id', company_id).single(),
        supabase
          .from('memberships')
          .select('plan_type')
          .eq('id', membership_id)
          .single(),
      ]
    );

    if (!companyData) throw new Error('Company not found');
    if (!membershipData) throw new Error('Membership not found');

    // Invite user through auth system
    const { data: authUser, error: authError } =
      await supabase.auth.admin.inviteUserByEmail(email, {
        data: {
          first_name: first_name,
          last_name: last_name,
          type: type || 'employee',
          company_name: companyData.name,
          membership: membershipData.name,
          meals_per_week: meals_per_week,
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
      meals_per_week,
      status: 'invited',
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
