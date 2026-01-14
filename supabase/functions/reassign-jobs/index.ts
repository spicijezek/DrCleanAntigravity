import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId, address } = await req.json();

    if (!clientId || !address) {
      return new Response(
        JSON.stringify({ error: 'clientId and address are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Reassigning jobs with address:', address, 'to client:', clientId);

    // Update all jobs with matching address
    const { data, error } = await supabase
      .from('jobs')
      .update({ client_id: clientId })
      .eq('title', address)
      .select('id, job_number, title');

    if (error) {
      console.error('Error updating jobs:', error);
      throw error;
    }

    console.log('Successfully updated jobs:', data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        updatedCount: data?.length || 0,
        jobs: data 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});