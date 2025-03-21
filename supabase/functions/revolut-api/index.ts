/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:44321/functions/v1/revolut-api' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/

import { createSupabaseClient } from '../_shared/supabaseClient.ts';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createSupabaseClient(req);

    // Get request body
    const body = await req.json();
    const { endpoint, method = 'GET', data = null } = body;

    // First, get the access token using our own supabase function
    const tokenResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/revolut-token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: req.headers.get('Authorization') || '',
        },
        body: JSON.stringify({ action: 'get' }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(`Failed to get token: ${JSON.stringify(tokenData)}`);
    }

    // Now make the actual API call to Revolut
    const revolutBaseUrl = 'https://sandbox-b2b.revolut.com/api/1.0';
    const revolutResponse = await fetch(`${revolutBaseUrl}/${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    const revolutData = await revolutResponse.json();

    if (!revolutResponse.ok) {
      // If unauthorized, try refreshing token and retrying once
      if (revolutResponse.status === 401) {
        // Token might have just expired, force refresh and retry
        const refreshResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/revolut-token`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: req.headers.get('Authorization') || '',
            },
            body: JSON.stringify({ action: 'refresh' }),
          }
        );

        const refreshData = await refreshResponse.json();

        if (!refreshResponse.ok) {
          throw new Error(
            `Failed to refresh token: ${JSON.stringify(refreshData)}`
          );
        }

        // Retry the API call with new token
        const retryResponse = await fetch(`${revolutBaseUrl}/${endpoint}`, {
          method,
          headers: {
            Authorization: `Bearer ${refreshData.access_token}`,
            'Content-Type': 'application/json',
          },
          body: data ? JSON.stringify(data) : undefined,
        });

        const retryData = await retryResponse.json();

        if (!retryResponse.ok) {
          throw new Error(
            `API request failed after token refresh: ${JSON.stringify(
              retryData
            )}`
          );
        }

        return new Response(JSON.stringify(retryData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`API request failed: ${JSON.stringify(revolutData)}`);
    }

    // Return successful response
    return new Response(JSON.stringify(revolutData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
