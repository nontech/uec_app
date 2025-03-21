/* To invoke locally:

  1. Run `supabase functions serve` (see: https://supabase.com/docs/reference/cli/supabase-functions-serve)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:44321/functions/v1/revolut-token' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
// @ts-ignore: allow Deno types
import { createSupabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsHeaders } from '../_shared/cors.ts';

console.log(`Function "revolut-token" up and running!`);

// @ts-ignore: allow Deno types
const revolutApiUrl = Deno.env.get('REVOLUT_API_URL')!;

const supabase = createSupabaseAdmin();

// @ts-ignore: allow Deno types
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get request body
    const body = await req.json();
    const { action } = body;

    if (action === 'get') {
      // Get active credentials from database
      const { data: credentials, error } = await supabase
        .from('revolut_credentials')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error)
        throw new Error(`Error fetching credentials: ${error.message}`);
      if (!credentials) throw new Error('No active credentials found');

      // Check if access token is expired
      const now = new Date();
      const accessTokenExpiry = new Date(credentials.access_token_expires_at);

      if (now > accessTokenExpiry) {
        // Access token expired, refresh it
        return await refreshToken(supabase, credentials);
      }

      // Return valid credentials
      return new Response(
        JSON.stringify({
          access_token: credentials.access_token,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Other token-related actions could be added here
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

async function refreshToken(supabase: any, credentials: any) {
  try {
    // Check if refresh token is also expired
    const now = new Date();
    const refreshTokenExpiry = new Date(credentials.refresh_token_expires_at);

    if (now > refreshTokenExpiry) {
      throw new Error(
        'Refresh token expired. User must reauthorize the application.'
      );
    }

    // Make request to refresh token
    const response = await fetch(
      'https://sandbox-b2b.revolut.com/api/1.0/auth/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: credentials.refresh_token,
          client_assertion_type:
            'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
          client_assertion: credentials.client_assertion,
        }),
      }
    );

    const tokenData = await response.json();

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${JSON.stringify(tokenData)}`);
    }

    // Calculate new expiry times
    const accessTokenExpiry = new Date(
      now.getTime() + tokenData.expires_in * 1000
    );

    // Update credentials in database
    const { error } = await supabase
      .from('revolut_credentials')
      .update({
        access_token: tokenData.access_token,
        access_token_expires_at: accessTokenExpiry.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', credentials.id);

    if (error)
      throw new Error(`Failed to update credentials: ${error.message}`);

    // Return new access token
    return new Response(
      JSON.stringify({
        access_token: tokenData.access_token,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }
}
